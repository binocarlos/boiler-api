"use strict";
const tape = require('tape')
const Logger = require('../../../src/logger')

tape('basic logger', (t) => {
  let logs = []
  const logger = Logger('test', {
    sink: (st) => logs.push(st)
  })
  logger.info('apples', 'fruit', {
    count: 10
  })

  t.equal(logs.length, 1, 'there is one log')

  const logData = JSON.parse(logs[0])

  delete(logData.timestamp)
  
  t.deepEqual(logData, {
    level: 30,
    name: 'test',
    action: 'apples',
    id: 'fruit',
    message: { count: 10 }
  }, 'the log data is correct')
  
  t.end()
})

tape('dont log', (t) => {
  let logs = []
  const logger = Logger('test', {
    sink: (st) => logs.push(st),
    level: 'error'
  })
  logger.info('apples', 'fruit', {
    count: 10
  })

  t.equal(logs.length, 0, 'there are no logs')

  t.end()
})

tape('do log', (t) => {
  let logs = []
  const logger = Logger('test', {
    sink: (st) => logs.push(st),
    level: 'trace'
  })
  logger.trace('apples', 'fruit', {
    count: 10
  })

  t.equal(logs.length, 1, 'there is one')

  t.end()
})