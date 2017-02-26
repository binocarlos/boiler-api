"use strict";
const tape = require('tape')
const tools = require('../testtools')
const Crud = require('../../../src/database/crud')

const getCrud = () => Crud('fruit')

const runTest = (t, postgres, handler) => {
  postgres = postgres || tools.postgres()
  const client = tools.client(postgres)
  handler(client.query, () => {
    t.end()
  })
}

tape('crud - sanity', (t) => {
  const postgres = tools.postgres()
  runTest(t, postgres, (query, done) => {
    getCrud().select(query, {
      color: 'red'
    }, (err, results) => {
      t.deepEqual(results, [], 'empty array')
      done()
    })
  })
})

tape('crud - select', (t) => {
  const q = {
    sql: 'select * from fruit where color = $1',
    params: ['red']
  }
  const results = [{
    name: 'apples'
  }, {
    name: 'oranges'
  }]
  const postgres = tools.postgres()
  postgres.expect(q, results)

  runTest(t, postgres, (query, done) => {
    getCrud().select(query, {
      color: 'red'
    }, (err, results) => {
      postgres.check(t, 'select query is correct')
      done()
    })
  })
})

tape('crud - get', (t) => {
  const q = {
    sql: 'select * from fruit where color = $1',
    params: ['red']
  }
  const results = [{
    name: 'apples'
  }, {
    name: 'oranges'
  }]
  const postgres = tools.postgres()
  postgres.expect(q, results)

  runTest(t, postgres, (query, done) => {
    getCrud().get(query, {
      color: 'red'
    }, (err, results) => {
      t.equal(results.name, 'apples', 'one result that is object')
      t.end()
    })
  })
})

tape('crud - insert', (t) => {
  const q = {
    sql: 'insert into fruit ( name, color ) values ( $1, $2 ) returning *',
    params: ['apples', 'red']
  }
  const postgres = tools.postgres()
  postgres.expect(q)

  runTest(t, postgres, (query, done) => {
    getCrud().insert(query, {
      name: 'apples',
      color: 'red'
    }, (err, results) => {
      postgres.check(t, 'insert query is correct')
      t.end()
    })
  })
})

tape('crud - update', (t) => {
  const q = {
    sql: 'update fruit set color = $1 where name = $2 returning *',
    params: ['green', 'apples']
  }
  const postgres = tools.postgres()
  postgres.expect(q)

  runTest(t, postgres, (query, done) => {
    getCrud().update(query, {
      color: 'green'
    }, {
      name: 'apples'
    }, (err, results) => {
      postgres.check(t, 'update query is correct')
      t.end()
    })
  })
})

tape('crud - delete', (t) => {
  const q = {
    sql: 'delete from fruit where name = $1',
    params: ['apples']
  }
  const postgres = tools.postgres()
  postgres.expect(q)

  runTest(t, postgres, (query, done) => {
    getCrud().delete(query, {
      name: 'apples'
    }, (err, results) => {
      postgres.check(t, 'delete query is correct')
      t.end()
    })
  })
})