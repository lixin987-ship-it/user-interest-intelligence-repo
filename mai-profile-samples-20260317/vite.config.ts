import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function dogfoodDataPlugin(): Plugin {
  const dogfoodDir = path.resolve(__dirname, '../MaiProfile/maiprofilev3dev/dogfood')
  const MANIFEST_ID = 'virtual:dogfood-data'
  const RUN_PREFIX = 'virtual:dogfood-run/'
  const RESOLVED_MANIFEST = '\0' + MANIFEST_ID
  const RESOLVED_RUN_PREFIX = '\0' + RUN_PREFIX

  /** Scan the dogfood directory tree and return metadata per run */
  function scanRuns() {
    const manifest: Record<string, { latestDate: string; runSummary: any | null }> = {}

    if (!fs.existsSync(dogfoodDir)) return manifest

    const topDirs = fs.readdirSync(dogfoodDir)
      .filter((d: string) => fs.statSync(path.join(dogfoodDir, d)).isDirectory())
      .sort()

    for (const topDir of topDirs) {
      const topPath = path.join(dogfoodDir, topDir)
      const subDirs = fs.readdirSync(topPath)
        .filter((d: string) => fs.statSync(path.join(topPath, d)).isDirectory())

      for (const subDir of subDirs) {
        const runKey = `${topDir}/${subDir}`
        const runPath = path.join(topPath, subDir)
        const dateDirs = fs.readdirSync(runPath)
          .filter((d: string) => fs.statSync(path.join(runPath, d)).isDirectory())
          .sort()

        const lastDate = dateDirs[dateDirs.length - 1] || ''

        // Read run_summary.json if available
        const summaryPath = path.join(runPath, 'run_summary.json')
        let runSummary = null
        if (fs.existsSync(summaryPath)) {
          try {
            runSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'))
          } catch { /* skip */ }
        }

        manifest[runKey] = { latestDate: lastDate, runSummary }
      }
    }
    return manifest
  }

  return {
    name: 'dogfood-data',
    resolveId(id) {
      if (id === MANIFEST_ID) return RESOLVED_MANIFEST
      if (id.startsWith(RUN_PREFIX)) return '\0' + id
    },
    load(id) {
      // ── Manifest: tiny, loaded statically ──
      if (id === RESOLVED_MANIFEST) {
        const manifest = scanRuns()
        // Generate per-run lazy loaders
        const loaderEntries = Object.keys(manifest).map(
          key => `  ${JSON.stringify(key)}: () => import("virtual:dogfood-run/${key}")`
        )
        const signalLoaderEntries = Object.keys(manifest).map(
          key => `  ${JSON.stringify(key)}: () => import("virtual:dogfood-signal-run/${key}")`
        )
        return [
          `export default ${JSON.stringify(manifest)};`,
          `export const runLoaders = {\n${loaderEntries.join(',\n')}\n};`,
          `export const signalLoaders = {\n${signalLoaderEntries.join(',\n')}\n};`,
        ].join('\n')
      }

      // ── Per-run chunk: loaded on demand ──
      if (id.startsWith(RESOLVED_RUN_PREFIX)) {
        const runKey = id.slice(RESOLVED_RUN_PREFIX.length)
        const parts = runKey.split('/')
        const topDir = parts[0]
        const subDir = parts.slice(1).join('/')
        const runPath = path.join(dogfoodDir, topDir, subDir)

        let data = ''
        if (fs.existsSync(runPath)) {
          const dateDirs = fs.readdirSync(runPath)
            .filter((d: string) => fs.statSync(path.join(runPath, d)).isDirectory())
            .sort()
          const lastDate = dateDirs[dateDirs.length - 1]
          if (lastDate) {
            const jsonlPath = path.join(runPath, lastDate, 'layer4_postprocessing.jsonl')
            if (fs.existsSync(jsonlPath)) {
              data = fs.readFileSync(jsonlPath, 'utf-8')
            }
          }
        }

        return `export default ${JSON.stringify(data)}`
      }
    },
  }
}

function dogfoodSignalDataPlugin(): Plugin {
  const dogfoodDir = path.resolve(__dirname, '../MaiProfile/maiprofilev3dev/dogfood')
  const PREFIX = 'virtual:dogfood-signal-run/'
  const RESOLVED_PREFIX = '\0' + PREFIX

  return {
    name: 'dogfood-signal-data',
    resolveId(id) {
      if (id.startsWith(PREFIX)) return '\0' + id
    },
    load(id) {
      if (!id.startsWith(RESOLVED_PREFIX)) return

      const runKey = id.slice(RESOLVED_PREFIX.length)
      const parts = runKey.split('/')
      const topDir = parts[0]
      const subDir = parts.slice(1).join('/')
      const runPath = path.join(dogfoodDir, topDir, subDir)

      let data = ''
      if (fs.existsSync(runPath)) {
        const dateDirs = fs.readdirSync(runPath)
          .filter((d: string) => fs.statSync(path.join(runPath, d)).isDirectory())
          .sort()

        const chunks: string[] = []
        for (const dateDir of dateDirs) {
          const jsonlPath = path.join(runPath, dateDir, 'layer0_signal.jsonl')
          if (fs.existsSync(jsonlPath)) {
            chunks.push(fs.readFileSync(jsonlPath, 'utf-8'))
          }
        }
        data = chunks.join('\n')
      }

      return `export default ${JSON.stringify(data)}`
    },
  }
}

// ── Intermediate Steps: manifest (tiny) + per-date lazy modules ──

const INTERMEDIATE_LAYERS = [
  'layer0_signal',
  'layer1_postprocessing',
  'layer2_merge',
  'layer2_postmerge',
] as const

/**
 * Manifest plugin — exports { [runKey]: string[] } (dates per run).
 * Tiny module; imported statically by the Intermediate Steps tab.
 */
function dogfoodIntermediateManifestPlugin(): Plugin {
  const dogfoodDir = path.resolve(__dirname, '../MaiProfile/maiprofilev3dev/dogfood')

  return {
    name: 'dogfood-intermediate-manifest',
    resolveId(id) {
      if (id === 'virtual:dogfood-intermediate-manifest') return '\0virtual:dogfood-intermediate-manifest'
    },
    load(id) {
      if (id !== '\0virtual:dogfood-intermediate-manifest') return

      const manifest: Record<string, string[]> = {}

      if (!fs.existsSync(dogfoodDir)) {
        return `export default ${JSON.stringify(manifest)}`
      }

      const topDirs = fs.readdirSync(dogfoodDir)
        .filter((d: string) => fs.statSync(path.join(dogfoodDir, d)).isDirectory())
        .sort()

      for (const topDir of topDirs) {
        const topPath = path.join(dogfoodDir, topDir)
        const subDirs = fs.readdirSync(topPath)
          .filter((d: string) => fs.statSync(path.join(topPath, d)).isDirectory())

        for (const subDir of subDirs) {
          const runKey = `${topDir}/${subDir}`
          const runPath = path.join(topPath, subDir)
          const dateDirs = fs.readdirSync(runPath)
            .filter((d: string) => fs.statSync(path.join(runPath, d)).isDirectory())
            .sort()

          if (dateDirs.length > 0) {
            manifest[runKey] = dateDirs
          }
        }
      }

      // Also generate loader map so Rollup discovers all per-date chunks
      const loaderEntries: string[] = []
      const rawLoaderEntries: string[] = []
      for (const [runKey, dates] of Object.entries(manifest)) {
        for (const d of dates) {
          loaderEntries.push(
            `  "${runKey}/${d}": () => import("virtual:dogfood-intermediate-date/${runKey}/${d}")`
          )
          rawLoaderEntries.push(
            `  "${runKey}/${d}": () => import("virtual:dogfood-intermediate-raw/${runKey}/${d}")`
          )
        }
      }

      return [
        `export default ${JSON.stringify(manifest)};`,
        `export const loaders = {\n${loaderEntries.join(',\n')}\n};`,
        `export const rawLoaders = {\n${rawLoaderEntries.join(',\n')}\n};`,
      ].join('\n')
    },
  }
}

/**
 * Per-date plugin — each `virtual:dogfood-intermediate-date/{topDir}/{subDir}/{date}`
 * becomes a separate lazy chunk containing only the 4 layer JSONL files for that date.
 * Also includes prev_layer2_postmerge from the previous date folder.
 */
function dogfoodIntermediateDatePlugin(): Plugin {
  const dogfoodDir = path.resolve(__dirname, '../MaiProfile/maiprofilev3dev/dogfood')
  const PREFIX = 'virtual:dogfood-intermediate-date/'
  const RAW_PREFIX = 'virtual:dogfood-intermediate-raw/'
  const RESOLVED_PREFIX = '\0' + PREFIX
  const RESOLVED_RAW_PREFIX = '\0' + RAW_PREFIX

  function parsePath(rest: string) {
    const parts = rest.split('/')
    const dateDir = parts[parts.length - 1]
    const topDir = parts[0]
    const subDir = parts.slice(1, -1).join('/')
    const runPath = path.join(dogfoodDir, topDir, subDir)
    return { dateDir, runPath, datePath: path.join(runPath, dateDir) }
  }

  return {
    name: 'dogfood-intermediate-date',
    resolveId(id) {
      if (id.startsWith(PREFIX)) return '\0' + id
      if (id.startsWith(RAW_PREFIX)) return '\0' + id
    },
    load(id) {
      // ── Essential layers (loaded on date-window click) ──
      if (id.startsWith(RESOLVED_PREFIX)) {
        const { dateDir, runPath, datePath } = parsePath(id.slice(RESOLVED_PREFIX.length))
        const result: Record<string, string> = {}

        for (const layer of INTERMEDIATE_LAYERS) {
          const p = path.join(datePath, `${layer}.jsonl`)
          if (fs.existsSync(p)) {
            result[layer] = fs.readFileSync(p, 'utf-8')
          }
        }

        // Find previous date's layer2_postmerge for snapshot diff
        const allDates = fs.readdirSync(runPath)
          .filter((d: string) => fs.statSync(path.join(runPath, d)).isDirectory())
          .sort()
        const idx = allDates.indexOf(dateDir)
        if (idx > 0) {
          const prevDate = allDates[idx - 1]
          const prevPath = path.join(runPath, prevDate, 'layer2_postmerge.jsonl')
          if (fs.existsSync(prevPath)) {
            result['prev_layer2_postmerge'] = fs.readFileSync(prevPath, 'utf-8')
          }
        }

        return `export default ${JSON.stringify(result)}`
      }

      // ── ALL raw files (loaded when Raw JSON Files section is expanded) ──
      if (id.startsWith(RESOLVED_RAW_PREFIX)) {
        const { datePath } = parsePath(id.slice(RESOLVED_RAW_PREFIX.length))
        const result: Record<string, string> = {}

        if (fs.existsSync(datePath)) {
          const allFiles = fs.readdirSync(datePath)
            .filter((f: string) => f.endsWith('.jsonl'))
            .sort()
          for (const file of allFiles) {
            const key = file.replace('.jsonl', '')
            result[key] = fs.readFileSync(path.join(datePath, file), 'utf-8')
          }
        }

        return `export default ${JSON.stringify(result)}`
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    dogfoodDataPlugin(),
    dogfoodSignalDataPlugin(),
    dogfoodIntermediateManifestPlugin(),
    dogfoodIntermediateDatePlugin(),
  ],
  base: '/user-interest-intelligence-repo/',
})
