"use strict";
const tape = require('tape')
const async = require('async')
const tools = require('./tools')

const headers = tools.headers

tape('installations - installations', (t) => {
  const userData = tools.UserData()

  async.series({

    register: (next) => tools.register(userData, next),
    installations: (next) => tools.installations(next),
    status: (next) => tools.status(next)

  }, (err, results) => {

    if(err) t.error(err)

    const register = results.register
    const installations = results.installations
    const status = results.status

    t.equal(installations.body.length, 1, '1 installation')
    t.equal(installations.body[0].name, 'My First Company', 'default installation')

    t.equal(register.body.data.meta.activeInstallation, installations.body[0].id, 'the user the active installation from the register request')
    t.equal(status.body.data.meta.activeInstallation, installations.body[0].id, 'the user the active installation from the status request')

    t.end()
  })
})

tape('installations - create installation', (t) => {
  const userData = tools.UserData()
  const INSTALLATION_NAME = 'apples install'
  const DATA = {
    name: INSTALLATION_NAME,
    meta: {
      fruit: 'pears'
    }
  }
  async.series({

    register: (next) => tools.register(userData, next),
    create: (next) => tools.createInstallation(DATA, next),
    installations: (next) => tools.installations(next)

  }, (err, results) => {

    if(err) t.error(err)

    const installations = results.installations.body

    const createdInstallation = installations.filter(i => i.name == INSTALLATION_NAME)

    t.equal(createdInstallation.length, 1, 'the installation was created')

    t.end()
  })
})

tape('installations - save installation', (t) => {
  const userData = tools.UserData()
  const INSTALLATION_NAME = 'apples install'
  const DATA = {
    name: INSTALLATION_NAME,
    meta: {
      fruit: 'apples'
    }
  }
  const SAVE_DATA = (obj) => {
    return {
      name: INSTALLATION_NAME + '2',
      meta: Object.assign({}, obj.meta, {
        color: 'oranges'
      })
    }
  }
  let obj = null

  async.series({

    register: (next) => tools.register(userData, next),
    create: (next) => tools.createInstallation(DATA, (err, r) => {
      if(err) return next(err)
      obj = r.body
      next()
    }),
    save: (next) => tools.saveInstallation(obj.id, SAVE_DATA(obj), next),
    installation: (next) => tools.getInstallation(obj.id, next)

  }, (err, results) => {

    if(err) t.error(err)

    const installation = results.installation.body

    t.equal(installation.id, obj.id, 'id sanity')
    t.deepEqual(installation.meta, {
      fruit: 'apples',
      color: 'oranges'
    }, 'merged meta-data')
    t.end()
  })
})

tape('installations - delete installation', (t) => {
  const userData = tools.UserData()
  const INSTALLATION_NAME = 'apples install'
  const DATA = {
    name: INSTALLATION_NAME,
    meta: {
      fruit: 'apples'
    }
  }
  let obj = null

  async.series({

    register: (next) => tools.register(userData, next),

    create: (next) => tools.createInstallation(DATA, (err, r) => {
      if(err) return next(err)
      obj = r.body
      next()
    }),

    del: (next) => tools.deleteInstallation(obj.id, next),
    installations: (next) => tools.installations(next)

  }, (err, results) => {

    if(err) t.error(err)

    const installations = results.installations.body

    t.equal(installations.length, 1, 'only 1 installation')
    t.equal(installations[0].name, 'My First Company', 'the only one is the default')
    t.end()
  })
})

tape('installations - activate installation', (t) => {
  const userData = tools.UserData()
  const INSTALLATION_NAME = 'apples install'
  let obj = null
  const DATA = {
    name: INSTALLATION_NAME,
    meta: {
      fruit: 'apples'
    }
  }
  async.series({

    register: (next) => tools.register(userData, next),

    create: (next) => tools.createInstallation(DATA, (err, r) => {
      if(err) return next(err)
      obj = r.body
      next()
    }),

    activate: (next) => tools.activateInstallation(obj.id, next),
    status: (next) => tools.status(next)

  }, (err, results) => {

    if(err) t.error(err)

    t.equal(parseInt(results.status.body.data.meta.activeInstallation), obj.id, 'active installation is correct')
    
    t.end()
  })
})

tape('installations - dont overwrite installation meta', (t) => {
  const userData = tools.UserData()
  const INSTALLATION_NAME = 'apples install'
  const DATA = {
    name: INSTALLATION_NAME,
    meta: {
      fruit: 'apples'
    }
  }
  const SAVE_DATA = (obj) => {
    return {
      name: INSTALLATION_NAME + '2'
    }
  }
  let obj = null

  async.series({

    register: (next) => tools.register(userData, next),
    create: (next) => tools.createInstallation(DATA, (err, r) => {
      if(err) return next(err)
      obj = r.body
      next()
    }),
    save: (next) => tools.saveInstallation(obj.id, SAVE_DATA(obj), next),
    installation: (next) => tools.getInstallation(obj.id, next)

  }, (err, results) => {

    if(err) t.error(err)

    const installation = results.installation.body

    t.equal(installation.meta.fruit, 'apples', 'meta still intact')

    t.end()
  })
})

tape('installations - access control - different user', (t) => {
  const userData1 = tools.UserData(1)
  const userData2 = tools.UserData(2)
  const INSTALLATION_NAME = 'apples install'

  let installationid = null
  let obj = null
  let users = null
  let status1 = null
  const DATA = {
    name: INSTALLATION_NAME,
    meta: {
      fruit: 'apples'
    }
  }
  async.series({

    user1: (next) => tools.register(userData1, next),

    status1: (next) => tools.status((err, s) => {
      if(err) return next(err)
      status1 = s
      installationid = s.body.data.meta.activeInstallation
      next()
    }),

    get1: (next) => tools.getInstallation(installationid, next),
    put1: (next) => tools.saveInstallation(installationid, {name:'updated1'}, next),

    logout: (next) => tools.logout(next),

    user2: (next) => tools.register(userData2, next),

    get2: (next) => tools.getInstallation(installationid, next),
    put2: (next) => tools.saveInstallation(installationid, {name:'updated2'}, next)

  }, (err, results) => {

    if(err) t.error(err)

    t.equal(results.get1.statusCode, 200, 'get1 200')
    t.equal(results.get2.statusCode, 403, 'get2 403')

    t.equal(results.put1.statusCode, 200, 'put1 200')
    t.equal(results.put2.statusCode, 403, 'put2 403')
    
    t.end()
  })
})

tape('installations - access control - no user', (t) => {
  const userData1 = tools.UserData(1)
  const userData2 = tools.UserData(2)
  const INSTALLATION_NAME = 'apples install'

  let installationid = null
  let obj = null
  let users = null
  let status1 = null
  const DATA = {
    name: INSTALLATION_NAME,
    meta: {
      fruit: 'apples'
    }
  }
  async.series({

    user1: (next) => tools.register(userData1, next),

    status1: (next) => tools.status((err, s) => {
      if(err) return next(err)
      status1 = s
      installationid = s.body.data.meta.activeInstallation
      next()
    }),

    put1: (next) => tools.saveInstallation(installationid, {name:'updated1'}, next),

    logout: (next) => tools.logout(next),

    put2: (next) => tools.saveInstallation(installationid, {name:'updated2'}, next),

  }, (err, results) => {

    if(err) t.error(err)

    t.equal(results.put1.statusCode, 200, 'get1 200')
    t.equal(results.put2.statusCode, 403, 'get2 403')
    
    t.end()
  })
})