import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export type Database = DatabaseSync

export function openDatabase(path: string): Database {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;')
  return db
}

export function migrate(db: Database): void {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')
  const migrationDirectory = resolve('server/migrations')
  const files = readdirSync(migrationDirectory).filter(file => file.endsWith('.sql')).sort()
  const applied = db.prepare('SELECT 1 FROM schema_migrations WHERE version = ?')
  const record = db.prepare('INSERT INTO schema_migrations(version) VALUES (?)')
  for (const file of files) {
    if (applied.get(file)) continue
    db.exec('BEGIN IMMEDIATE')
    try {
      db.exec(readFileSync(join(migrationDirectory, file), 'utf8'))
      record.run(file)
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  }
}

export function inTransaction<T>(db: Database, operation: () => T): T {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = operation()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}
