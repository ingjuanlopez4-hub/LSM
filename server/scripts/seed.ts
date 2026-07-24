import { readConfig } from '../config.js'
import { migrate, openDatabase } from '../database.js'
import { seedDatabase } from '../seed-data.js'

const config = readConfig()
const db = openDatabase(config.databasePath)
try {
  migrate(db)
  seedDatabase(db)
  console.log(JSON.stringify({ level: 'info', message: 'Database seed applied', database: config.databasePath }))
} finally { db.close() }
