"use strict";

const pg = require('pg')
const Logger = require('../logger')

const logger = Logger('postgres:connection')

function Postgres(settings) {
  const config = Object.assign({}, settings, {
    max: 20,
    min: 4,
    idleTimeoutMillis: 1000
  })
  
  const pool = new pg.Pool(config)
  let acquireCount = 0
  let connectCount = 0

  pool.on('acquire', client => {
    acquireCount++
    logger.trace('acquire', 'system', {
      count: acquireCount
    })
  })

  pool.on('connect', client => {
    connectCount++
    logger.trace('connect', 'system', {
      count: connectCount
    })
  })

  pool.on('error', function (error, client) {
    logger.error('connect', 'system', {
      error: error.message.toString(),
      stack: error.stack
    })
  })

  return pool
}

module.exports = Postgres