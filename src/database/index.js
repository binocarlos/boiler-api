"use strict";

const Postgres = require('./postgres')
const PostgresClient = require('./client')

const connectionFactory = (opts) => {
  opts = opts || {}
  const postgres = Postgres({
    user: opts.user,
    database: opts.database,
    password: opts.password,
    host: opts.host,
    port: opts.port
  })
  return PostgresClient(postgres)
}

module.exports = connectionFactory