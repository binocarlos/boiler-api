"use strict";
const tape = require('tape')
const apptools = require('../../../src/tools')
const tools = require('../testtools')
const Installation = require('../../../src/models/installation')

const USER_ACCOUNT = {
  email: 'bob@bob.com',
  password: 'apples'
}

const runTest = (postgres, handler, done) => {
  const connection = tools.connection(postgres)
  connection((client, finish) => {
    handler(client, finish)
  }, done)
}

tape('models.installation - create', (t) => {
  const DATA = { name: 'apples' }
  const USERID = 5

  const postgres = tools.postgres()

  postgres.expect(Installation.QUERIES.insertInstallation(DATA), [Object.assign({}, DATA, {id:10})])
  postgres.expect(Installation.QUERIES.insertCollaboration(USERID), [{id:12,useraccount:USERID,installation:10,permission:'owner'}])

  const client = tools.client(postgres)

  Installation.create(client.query, {
    data: DATA,
    userid: USERID
  }, (err, result) => {
    if(err) t.error(err)
    postgres.check(t, 'installation create queries are correct')
    t.end()
  })
  
})
