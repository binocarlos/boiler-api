"use strict";

// numeric levels
const LEVELS = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10
}

LEVELS.silent = LEVELS.fatal + 1

// what logging level our env means
const ENV_LOGLEVELS = {
  production: 'info',
  test: 'silent',
  development: 'trace'
}

const NODE_ENV = process.env.NODE_ENV || 'production'
const ENV_LOGLEVEL = ENV_LOGLEVELS[NODE_ENV]
const LOGLEVEL = process.env.LOGLEVEL || ENV_LOGLEVELS[process.env.NODE_ENV] || ENV_LOGLEVELS.production

const dumbLogger = (action, tracer, message) => {}

const Logger = (name, opts) => {
  opts = opts || {}
  const sink = opts.sink || console.log
  const useLevel = opts.level ?
    LEVELS[opts.level] :
    LEVELS[LOGLEVEL]
  const logger = Object.keys(LEVELS)
    .reduce((all, level) => {
      const numericLevel = LEVELS[level]
      const realLogger = (action, tracer, message) => {

        tracer = typeof(tracer) == 'string' ? {id:tracer} : tracer
        sink(JSON.stringify({
          timestamp: new Date().getTime(),
          level: numericLevel,
          tracer,
          name,
          action,
          message
        }))
      }
      const loggingFn = numericLevel >= useLevel ?
        realLogger :
        dumbLogger
      return Object.assign({}, all, {
        [level]: loggingFn
      })
    }, {})

  return logger
}

module.exports = Logger