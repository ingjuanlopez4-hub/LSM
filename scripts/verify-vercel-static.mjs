import { existsSync, readFileSync } from 'node:fs'

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
const errors = []

if (config.framework !== 'vite' || config.outputDirectory !== 'dist') errors.push('Vercel must deploy only the Vite dist directory.')
if (config.buildCommand !== 'npm run build:vercel') errors.push('Vercel must run the guarded static build.')
if (config.functions || config.builds) errors.push('Vercel Functions and custom builds are forbidden until the backend blockers are resolved.')
for (const directory of ['api', 'functions']) {
  if (existsSync(new URL(`../${directory}`, import.meta.url))) errors.push(`Remove /${directory}: this repository must not expose serverless backend functions.`)
}
if (process.env.VITE_API_URL) errors.push('VITE_API_URL is unsupported: the current Vercel deployment is frontend-only.')

if (errors.length) {
  console.error(errors.map(error => `ERROR: ${error}`).join('\n'))
  process.exit(1)
}

console.log('Verified frontend-only Vercel deployment; Express/node:sqlite is not included.')
