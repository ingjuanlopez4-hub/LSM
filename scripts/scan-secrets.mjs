import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const patterns = [
  { name: 'private key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'GitHub token', regex: /\bgh[opurs]_[A-Za-z0-9_]{30,}\b/ },
  { name: 'AWS access key', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z_-]{35}\b/ },
]
const findings = []

for (const file of files) {
  let content
  try { content = readFileSync(file, 'utf8') } catch { continue }
  for (const pattern of patterns) if (pattern.regex.test(content)) findings.push(`${file}: possible ${pattern.name}`)
}

if (findings.length) {
  console.error(findings.join('\n'))
  process.exit(1)
}
console.log(`Secret scan passed (${files.length} non-ignored files).`)
