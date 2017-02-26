"use strict";
const EventBus = require('../../src/eventBus')
const Client = require('../../src/database/client')
const objhash = require('object-hash')

const queryHash = (sql, params) => {
  return objhash({
    sql,
    params
  })
}

// event bus that keeps a hash log of events
// and can compare against an expected log
// useful for unit testing the models
// (which emit events for on the commandBus)
const MockEventBus = () => {
  let state = {
    events: []
  }
  const bus = EventBus()
  bus.listen((channel, message) => {
    state.events.push({
      channel,
      message
    })
  })
  bus.getState = () => state
  return bus
}

const strip = (sql) => {
  sql = (sql || '').replace(/\n/g, ' ')
  sql = (sql || '').replace(/\s*$/, '')
  sql = (sql || '').replace(/"/g, '')
  return sql
}

// mock postgres that logs the queries
// and uses a hash to record results / compare
const Postgres = (opts) => {
  opts = opts || {}
  let state = {
    finished: false,
    queries: {
      expected: {
        db: {},
        list: []
      },
      actual: {
        db: {},
        list: []
      }
    }
  }

  const processParams = (params) => opts.noParams ? [] : params
  const processQuery = (sql, params) => {
    sql = strip(sql)
    params = processParams(params || [])
    return {
      sql,
      params
    }
  }

  const addQuery = (section, q, results) => {
    if(typeof(q) == 'string') {
      q = {
        sql: q,
        params: []
      }
    }
    const query = processQuery(q.sql, q.params)
    const hash = queryHash(query)
    state.queries[section].db[hash] = {
      query,
      results
    }
    state.queries[section].list.push(hash)
  }
  const addExpectedQuery = (q, results) => addQuery('expected', q, results)
  const addActualQuery = (q, results) => addQuery('actual', q, results)
  const setFinished = () => state.finished = true

  /*
  
    shims
    
  */
  const runQuery = (sql, params, done) => {
    const query = processQuery(sql, params)
    const hash = queryHash(query)
    const expected = state.queries.expected.db[hash]
    const results = expected ?
      expected.results :
      []
    addActualQuery(query, results)
    // simulate async
    setTimeout(() => done(null, {
      rows: results
    }), 10)
  }

  const check = (t, msg) => {
    const queries = state.queries
    t.deepEqual(queries.expected, queries.actual, msg || 'the query logs are the same')
  }

  const connect = (handler) => handler(null, {query:runQuery}, setFinished)

  return {
    connect,
    query: runQuery,
    expect: addExpectedQuery,
    getState: () => state,
    check: check
  }
}

const client = (postgres) => Client(postgres)

module.exports = {
  postgres: Postgres,
  client,
  eventBus: MockEventBus,
  strip
}