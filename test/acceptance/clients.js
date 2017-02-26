"use strict";
const tape = require('tape')
const async = require('async')
const tools = require('./tools')

const headers = tools.headers
const CLIENTDATA = {
  meta: {
    name: 'bob the client'  
  }
}

const createClient = (userData, done) => {
  if(!done) {
    done = userData
    userData = tools.UserData() 
  }
  let user = null

  async.series({
    user: (next) => tools.register(userData, next),
    clientData: (next) => tools.newClientData(next)
  }, (err, results) => {
    if(err) return done(err)

    const user = results.user.body.data
    const installationid = user.meta.activeInstallation 
    const clientData = Object.assign({}, results.clientData.body, CLIENTDATA)

    tools.createClient(installationid, clientData, (err, client) => {
      if(err) return done(err)
      done(null, Object.assign({}, results, {
        client,
        installationid
      }))
    })
  })
}

tape('clients - default client data', (t) => {

  const userData = tools.UserData()
  let user = null

  async.series({
    user: (nextp) => tools.register(userData, nextp),
    client: (nextp) => tools.newClientData(nextp)
  }, (err, results) => {
    if(err) t.error(err)
    const data = results.client.body
    t.ok(data.email.indexOf('@') > 0, 'we have a client email')
    t.equal(typeof(data.password), 'string', 'default password is string')
    t.ok(data.password.length > 6, 'default password > 6 chars')
    t.end()
  })
  
})

tape('clients - create client', (t) => {

  createClient((err, results) => {
    if(err) t.error(err)

    t.equal(results.client.statusCode, 201, 'create 201 status')
    t.equal(results.client.body.meta.name, CLIENTDATA.meta.name, 'client name is correct')

    t.end()

  })
  
})

tape('clients - list clients - no installation id', (t) => {

  async.waterfall([
    createClient,
    (results, next) => tools.listClients(null, next)
  ], (err, results) => {
    if(err) t.error(err)

    t.equal(results.statusCode, 403, '403 status no installation id')
    t.end()
  })

  
})

tape('clients - list clients', (t) => {

  async.waterfall([
    createClient,
    (results, next) => tools.listClients(results.installationid, next)
  ], (err, results) => {
    if(err) t.error(err)

    const clients = results.body

    t.equal(results.statusCode, 200, '200 status')
    t.ok(clients.length, 'result is array of 1')
    t.ok(clients[0].email.indexOf('@') > 0, 'the client has an email')
    t.equal(clients[0].meta.name, CLIENTDATA.meta.name, 'client name is correct')
    t.end()
  })

  
})


tape('clients - save client - no installation id', (t) => {

  async.waterfall([
    createClient,
    (results, next) => {
      const client = results.client.body
      const clientid = client.id
      delete(client.id)

      client.email = 'bob@bob123.com'
      client.meta.fruit = 'oranges'

      tools.saveClient(null, clientid, client, next)
    }
  ], (err, results) => {
    if(err) t.error(err)

    t.equal(results.statusCode, 403, '403 status no installation id')

    t.end()
  })

  
})


tape('clients - get client', (t) => {

  async.waterfall([
    createClient,
    (results, next) => tools.getClient(results.installationid, results.client.body.id, next)
  ], (err, results) => {
    if(err) t.error(err)

    const client = results.body

    t.equal(client.meta.name, CLIENTDATA.meta.name, 'get client name correct')

    t.end()
  })

  
})


tape('clients - save client', (t) => {

  async.waterfall([
    createClient,
    (results, next) => {
      const client = results.client.body
      const clientid = client.id
      delete(client.id)

      client.email = 'SAVED' + client.email
      client.meta.fruit = 'oranges'

      tools.saveClient(results.installationid, clientid, client, next)
    }
  ], (err, results) => {
    if(err) t.error(err)

    const client = results.body
    t.equal(client.email.indexOf('SAVED'), 0, 'saved email')
    t.equal(client.meta.fruit, 'oranges', 'saved meta')

    t.end()
  })

  
})

tape('clients - delete client', (t) => {

  let createresults = null
  let deleteresults = null
  async.waterfall([
    createClient,
    (results, next) => {
      const client = results.client.body
      const clientid = client.id
      delete(client.id)
      createresults = results
      tools.deleteClient(createresults.installationid, clientid, next)
    },
    (results, next) =>  {
      deleteresults = results
      next(null, deleteresults)
    },
    (deleteresults, next) => tools.listClients(createresults.installationid, next)
  ], (err, listresults) => {
    if(err) t.error(err)

    t.equal(listresults.statusCode, 200, '200 status code for list')
    t.equal(deleteresults.statusCode, 200, '200 status code for deleteresults')
    t.equal(listresults.body.length, 0, 'no clients in list')

    t.end()
  })

  
})

tape('clients - cross installation get client', (t) => {

  const userData1 = tools.UserData('bob1')
  const userData2 = tools.UserData('bob2')

  let users = null

  async.waterfall([

    (next) => {
      async.series({
        user1: (unext) => createClient(userData1, unext),
        user2: (unext) => createClient(userData2, unext)
      }, next)
    },

    (results, next) => {
      const installationid1 = results.user1.user.body.data.meta.activeInstallation
      const installationid2 = results.user2.user.body.data.meta.activeInstallation
      const clientid1 = results.user1.client.body.id
      const clientid2 = results.user2.client.body.id

      users = {
        installationid1,
        installationid2,
        clientid1,
        clientid2
      }

      tools.login(userData1, next)
    },

    (login, next) => {

      async.series({
        canaccess: (nexts) => tools.getClient(users.installationid1, users.clientid1, nexts),
        cantaccess: (nexts) => tools.getClient(users.installationid1, users.clientid2, nexts),
      }, next)

    }

  ], (err, results) => {
    if(err) t.error(err)

    t.equal(results.canaccess.statusCode, 200, '200 can access')
    t.equal(results.cantaccess.statusCode, 403, '403 cant access')

    t.end()
  })

  
})


tape('clients - cross installation save client', (t) => {

  const userData1 = tools.UserData('bob1')
  const userData2 = tools.UserData('bob2')

  let users = null

  async.waterfall([

    (next) => {
      async.series({
        user1: (unext) => createClient(userData1, unext),
        user2: (unext) => createClient(userData2, unext)
      }, next)
    },

    (results, next) => {
      const installationid1 = results.user1.user.body.data.meta.activeInstallation
      const installationid2 = results.user2.user.body.data.meta.activeInstallation
      const clientid1 = results.user1.client.body.id
      const clientid2 = results.user2.client.body.id

      const client1 = results.user1.client.body
      const client2 = results.user1.client.body

      client1.meta.fruit = 'oranges'
      client2.meta.fruit = 'oranges'

      users = {
        installationid1,
        installationid2,
        clientid1,
        clientid2,
        client1,
        client2
      }

      tools.login(userData1, next)
    },

    (login, next) => {

      async.series({
        canaccess: (nexts) => tools.saveClient(users.installationid1, users.clientid1, users.client1, nexts),
        cantaccess: (nexts) => tools.saveClient(users.installationid1, users.clientid2, users.client2, nexts),
      }, next)

    }

  ], (err, results) => {
    if(err) t.error(err)

    t.equal(results.canaccess.statusCode, 200, '200 can access')
    t.equal(results.cantaccess.statusCode, 403, '403 cant access')

    t.end()
  })

  
})