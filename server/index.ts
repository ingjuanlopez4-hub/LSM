import { createServer } from 'node:http'
import { createApp } from './app.js'
import { readConfig } from './config.js'
import { migrate, openDatabase } from './database.js'

const config = readConfig()
const db = openDatabase(config.databasePath)
migrate(db)
const server = createServer(createApp({ db, config }))

server.listen(config.port, config.host, () => {
  console.log(JSON.stringify({ level: 'info', message: 'Manos MX API listening', host: config.host, port: config.port, environment: config.nodeEnv, authMode: config.authMode }))
})

function shutdown(signal: string) {
  console.log(JSON.stringify({ level: 'info', message: 'Shutting down', signal }))
  server.close(error => {
    db.close()
    process.exitCode = error ? 1 : 0
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
