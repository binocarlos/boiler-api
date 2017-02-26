"use strict";

const Logger = require('../logger')
const logger = Logger('postgres:client')
const async = require('async')

const processQuery = (q) => {
  if(typeof(q) == 'string') {
    q = {
      sql: q,
      params: []
    }
  }
  return q
}

// wrap the pg.query with a single object with {sql,params}
const QueryFactory = (runner) => (q, done) => {
  q = processQuery(q)
  runner(q.sql, q.params, (err, results) => {
    if(err) {
      logger.error('query', q.tracer, {
        error: err.toString(),
        query: q
      })
      if(process.env.LOGSQL) {
        console.log('-------------------------------------------');
        console.log('sql error')
        console.dir(q)
        console.log(err)
      }
    }
    else {
      logger.debug('query', q.tracer, {
        query: q,
        results: (results || {}).rows
      })
      if(process.env.LOGSQL) {
        console.log('-------------------------------------------');
        console.log('sql results')
        console.dir(q)
        console.dir(results.rows)
      }
    }
    if(err) return done(err.toString())
    done(null, results)
  })
}

const getTracerFromReq = (req) => {
  const userid = req.user ? req.user.id : null
  return {
    tracerid: req.id,
    installationid: req.installationid,
    userid
  }
}

// returns an api with:
//  * query({sql,params}, done)        - one off query, client returned automatically    
//  * transaction(handler, done)       - connection wrapped in BEGIN/COMMIT/ROLLBACK
// 
// handler(query, done)                - query is same ({sql,params},done)
const Client = (postgres) => {

  // the auto-pool closing query function
  const postgresQuery = postgres.query.bind(postgres)

  // get a client that we close ourselves - used for transactions
  const postgresConnect = postgres.connect.bind(postgres)

  // run queries on the pool directly
  const query = QueryFactory(postgresQuery)

  const tracer = (tracerData, runQuery) => (q, done) => {
    runQuery = runQuery || query
    q = processQuery(q)
    q.tracer = tracerData
    runQuery(q, done)
  }

  // run a transaction with a query object
  const transaction = (req, handler, done) => {
    const tracerData = getTracerFromReq(req)

    postgres.connect((err, client, release) => {
      if(err) {
        release()
        return done(err)
      }

      const db = {
        tracer: tracerData,
        setValue: (f, v) => tracerData[f] = v,
        run: tracer(tracerData, QueryFactory(client.query.bind(client)))
      }

      async.series({
        begin:   (next) => db.run('BEGIN', next),
        command: (next) => handler(db, next),
        commit:  (next) => db.run('COMMIT', next)
      }, (err, results) => {
        if(err) {
          db.run('ROLLBACK', () => {
            release()
            done(err)
          })
        }
        else{
          release()
          done(null, results.command)
        }
      })
    })
  }

  return {
    tracer,
    transaction,
    connection: (req) => {
      const tracerData = getTracerFromReq(req)
      return {
        tracer: tracerData,
        setValue: (f, v) => tracerData[f] = v,
        run: tracer(tracerData)
      }
    }
  }
}

module.exports = Client