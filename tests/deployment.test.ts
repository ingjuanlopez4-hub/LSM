import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type Header = { key: string; value: string }
type HeaderRule = { source: string; headers: Header[] }

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
  framework: string
  buildCommand: string
  outputDirectory: string
  headers: HeaderRule[]
  rewrites: { source: string; destination: string }[]
  functions?: unknown
  builds?: unknown
}

describe('frontend-only Vercel contract', () => {
  it('publishes only the guarded Vite output with an SPA fallback', () => {
    expect(config).toMatchObject({ framework: 'vite', buildCommand: 'npm run build:vercel', outputDirectory: 'dist' })
    expect(config.functions).toBeUndefined()
    expect(config.builds).toBeUndefined()
    expect(config.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' })
  })

  it('keeps the CSP narrow and includes every intentional external resource origin', () => {
    const headers = Object.fromEntries(config.headers.find(rule => rule.source === '/(.*)')!.headers.map(header => [header.key, header.value]))
    expect(headers['Content-Security-Policy']).toContain("default-src 'none'")
    expect(headers['Content-Security-Policy']).toContain("script-src 'self'")
    expect(headers['Content-Security-Policy']).toContain('style-src \'self\' https://fonts.googleapis.com')
    expect(headers['Content-Security-Policy']).toContain('font-src https://fonts.gstatic.com')
    expect(headers['Content-Security-Policy']).toContain("img-src 'self' data: https://images.unsplash.com")
    expect(headers['Content-Security-Policy']).not.toMatch(/unsafe-inline|unsafe-eval|\s\*\s/)
    expect(headers).toMatchObject({
      'Strict-Transport-Security': 'max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    })
  })
})
