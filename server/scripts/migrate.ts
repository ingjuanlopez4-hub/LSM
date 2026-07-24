import { readConfig } from '../config.js'
import { migrate, openDatabase } from '../database.js'

const config = readConfig()
const db = openDatabase(config.databasePath)
try {
  migrate(db)
  console.log(JSON.stringify({ level: 'info', message: 'Database migrations applied', database: config.databasePath }))
} finally { db.close() }
