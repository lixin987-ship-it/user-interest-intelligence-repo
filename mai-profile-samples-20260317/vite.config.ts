import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function dogfoodDataPlugin(): Plugin {
  const dogfoodDir = path.resolve(__dirname, '../MaiProfile/maiprofilev3dev/dogfood')

  return {
    name: 'dogfood-data',
    resolveId(id) {
      if (id === 'virtual:dogfood-data') return '\0virtual:dogfood-data'
    },
    load(id) {
      if (id !== '\0virtual:dogfood-data') return

      const runs: Record<string, { latestDate: string; data: string; runSummary: any | null }> = {}

      if (!fs.existsSync(dogfoodDir)) {
        return `export default ${JSON.stringify(runs)}`
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

          const lastDate = dateDirs[dateDirs.length - 1]
          if (!lastDate) continue

          const jsonlPath = path.join(runPath, lastDate, 'layer4_postprocessing.jsonl')
          if (!fs.existsSync(jsonlPath)) continue

          const content = fs.readFileSync(jsonlPath, 'utf-8')

          // Read run_summary.json if available
          const summaryPath = path.join(runPath, 'run_summary.json')
          let runSummary = null
          if (fs.existsSync(summaryPath)) {
            try {
              runSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'))
            } catch { /* skip */ }
          }

          runs[runKey] = { latestDate: lastDate, data: content, runSummary }
        }
      }

      return `export default ${JSON.stringify(runs)}`
    },
  }
}

function dogfoodSignalDataPlugin(): Plugin {
  const dogfoodDir = path.resolve(__dirname, '../MaiProfile/maiprofilev3dev/dogfood')

  return {
    name: 'dogfood-signal-data',
    resolveId(id) {
      if (id === 'virtual:dogfood-signal-data') return '\0virtual:dogfood-signal-data'
    },
    load(id) {
      if (id !== '\0virtual:dogfood-signal-data') return

      // Shape: { [runKey]: { dates: string[], data: string } }
      // data = all layer0_signal.jsonl lines from ALL date folders concatenated
      const runs: Record<string, { dates: string[]; data: string }> = {}

      if (!fs.existsSync(dogfoodDir)) {
        return `export default ${JSON.stringify(runs)}`
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

          if (dateDirs.length === 0) continue

          const chunks: string[] = []
          for (const dateDir of dateDirs) {
            const jsonlPath = path.join(runPath, dateDir, 'layer0_signal.jsonl')
            if (fs.existsSync(jsonlPath)) {
              chunks.push(fs.readFileSync(jsonlPath, 'utf-8'))
            }
          }
          if (chunks.length === 0) continue

          runs[runKey] = { dates: dateDirs, data: chunks.join('\n') }
        }
      }

      return `export default ${JSON.stringify(runs)}`
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
      for (const [runKey, dates] of Object.entries(manifest)) {
        for (const d of dates) {
          loaderEntries.push(
            `  "${runKey}/${d}": () => import("virtual:dogfood-intermediate-date/${runKey}/${d}")`
          )
        }
      }

      return [
        `export default ${JSON.stringify(manifest)};`,
        `export const loaders = {\n${loaderEntries.join(',\n')}\n};`,
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
  const RESOLVED_PREFIX = '\0' + PREFIX

  return {
    name: 'dogfood-intermediate-date',
    resolveId(id) {
      if (id.startsWith(PREFIX)) return '\0' + id
    },
    load(id) {
      if (!id.startsWith(RESOLVED_PREFIX)) return
      const rest = id.slice(RESOLVED_PREFIX.length) // e.g. "20260318/ModulizationGPT4oV0.6/20260228"
      const parts = rest.split('/')
      const dateDir = parts[parts.length - 1]
      const topDir = parts[0]
      const subDir = parts.slice(1, -1).join('/')
      const runPath = path.join(dogfoodDir, topDir, subDir)
      const datePath = path.join(runPath, dateDir)

      const result: Record<string, string> = {}

      for (const layer of INTERMEDIATE_LAYERS) {
        const filePath = path.join(datePath, `${layer}.jsonl`)
        if (fs.existsSync(filePath)) {
          result[layer] = fs.readFileSync(filePath, 'utf-8')
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
