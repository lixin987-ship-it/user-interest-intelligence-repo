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

      const runs: Record<string, { latestDate: string; data: string }> = {}

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
          runs[runKey] = { latestDate: lastDate, data: content }
        }
      }

      return `export default ${JSON.stringify(runs)}`
    },
  }
}

export default defineConfig({
  plugins: [react(), dogfoodDataPlugin()],
  base: '/user-interest-intelligence-repo/',
})
