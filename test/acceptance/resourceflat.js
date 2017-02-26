"use strict";
const tape = require('tape')
const async = require('async')
const tools = require('./tools')
const FIXTURES = require('./fixtures.json')
const NODE = FIXTURES.resourceNode
const TYPENODES = FIXTURES.resourceTypes
const TREE = FIXTURES.resourceTree
const headers = tools.headers

const register = (userData, done) => {
  if(!done) {
    done = userData
    userData = tools.UserData() 
  }
  let user = null

  async.series({
    user: (next) => tools.register(userData, next)
  }, (err, results) => {
    if(err) t.error(err)
    const user = results.user.body.data
    const installationid = user.meta.activeInstallation 
    done(null, {
      user,
      installationid
    })

  })
}

const createSingleResource = (userData, data, done) => {
  data = data || NODE
  register(userData, (err, base) => {
    if(err) t.error(err)
    tools.createResource(base.installationid, data, (err, results) => {
      if(err) return done(err)
      done(null, Object.assign({}, base, {
        folder: results
      }))
    })
  })
}

tape('resourceflat - create resource', (t) => {
  const userData = tools.UserData()

  createSingleResource(userData, NODE, (err, base) => {

    const folder = base.folder

    t.equal(folder.statusCode, 201, '201 code')
    t.equal(folder.body.name, NODE.name, 'resource name')
    t.equal(folder.body.meta.price, NODE.meta.price, 'resource meta')

    t.end()
  })
})

tape('resourceflat - get resource', (t) => {
  const userData = tools.UserData()

  createSingleResource(userData, NODE, (err, base) => {

    tools.getResource(base.installationid, base.folder.body.id, {}, (err, results) => {

      const folder = results
      t.equal(folder.statusCode, 200, '200 code')
      t.equal(folder.body.name, NODE.name, 'resource name')
      
      t.end()
    })

  })
})

tape('resourceflat - list resources', (t) => {
  const userData = tools.UserData()

  createSingleResource(userData, NODE, (err, base) => {

    tools.listResources(base.installationid, {}, (err, results) => {

      t.equal(results.statusCode, 200, '200 code')
      t.equal(results.body[0].name, NODE.name, 'resource name')
      
      t.end()
    })

  })
})

tape('resourceflat - list resources - no installation id', (t) => {
  const userData = tools.UserData()

  createSingleResource(userData, NODE, (err, base) => {

    tools.listResources(null, {}, (err, results) => {

      t.equal(results.statusCode, 403, '403 status no installation id')
      
      t.end()
    })

  })
})

tape('resourceflat - save resource', (t) => {

  const userData = tools.UserData()

  createSingleResource(userData, NODE, (err, base) => {

    let resource = base.folder.body
    const resourceid = resource.id
    delete(resource.id)

    resource.meta.height = 20

    tools.saveResource(base.installationid, resourceid, resource, (err, results) => {

      t.equal(results.statusCode, 200, '200 code')
      t.equal(results.body.meta.height, 20, 'resource updated')
      
      t.end()
    })

  })

})

tape('resourceflat - save resource - no installation id', (t) => {

  const userData = tools.UserData()

  createSingleResource(userData, NODE, (err, base) => {

    let resource = base.folder.body
    const resourceid = resource.id
    delete(resource.id)

    resource.meta.height = 20

    tools.saveResource(null, resourceid, resource, (err, results) => {

      t.equal(results.statusCode, 403, '403 status no installation id')
      
      t.end()
    })

  })

  
})

tape('resourceflat - delete resource', (t) => {

  const userData = tools.UserData()

  let createresults = null
  let deleteresults = null
  async.waterfall([
    (next) => createSingleResource(userData, NODE, next),
    (base, next) => {
      const resource = base.folder.body
      const resourceid = resource.id
      createresults = base
      tools.deleteResource(base.installationid, resourceid, next)
    },
    (results, next) =>  {
      deleteresults = results
      next(null, deleteresults)
    },
    (deleteresults, next) => tools.listResources(createresults.installationid, {}, next)
  ], (err, delresults) => {
    if(err) t.error(err)

    t.equal(delresults.statusCode, 200, '200 code')
    t.equal(delresults.body.length, 0, 'no resources in list')

    t.end()
  })

  
})

tape('resourceflat - cross installation get resource', (t) => {

  const userData1 = tools.UserData('bob1')
  const userData2 = tools.UserData('bob2')

  let users = null

  async.waterfall([

    (next) => {
      async.series({
        user1: (unext) => createSingleResource(userData1, NODE, unext),
        user2: (unext) => createSingleResource(userData2, NODE, unext)
      }, next)
    },

    (results, next) => {
      const installationid1 = results.user1.user.meta.activeInstallation
      const installationid2 = results.user2.user.meta.activeInstallation
      const resourceid1 = results.user1.folder.body.id
      const resourceid2 = results.user2.folder.body.id

      users = {
        installationid1,
        installationid2,
        resourceid1,
        resourceid2
      }

      tools.login(userData1, next)
    },

    (login, next) => {

      async.series({
        canaccess: (nexts) => tools.getResource(users.installationid1, users.resourceid1, {}, nexts),
        cantaccess: (nexts) => tools.getResource(users.installationid1, users.resourceid2, {}, nexts),
      }, next)

    }

  ], (err, results) => {
    if(err) t.error(err)

    t.equal(results.canaccess.statusCode, 200, '200 can access')
    t.equal(results.cantaccess.statusCode, 403, '403 cant access')

    t.end()
  })

  
})


tape('resourceflat - search resource on type', (t) => {

  const userData = tools.UserData()

  register(userData, (err, base) => {
    async.series({
      create: (next) => async.series(TYPENODES.map(node => cnext => tools.createResource(base.installationid, node, cnext)), next),
      list: (next) => tools.listResources(base.installationid, {type:'folder'}, next)
    }, (err, results) => {
      if(err) t.error(err)

      t.equal(results.list.body.length, 1, 'only 1 result (folder)')
      t.end()
    })
  })
  
})
