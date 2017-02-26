"use strict";

const urlparse = require('url').parse
const tools = require('../tools')

const Version = require('./version')
const Auth = require('./auth')
const Installations = require('./installation')

const Routes = (settings, controllers, userRoutes) => (app, access) => {

  const binds = tools.httpbinds(app)

  const version = Version()
  const auth = Auth(controllers)
  const installations = Installations(controllers)

  // utils
  binds.get('/version', version)

  // auth
  binds.get('/status', auth.status)
  binds.post('/login', auth.login)
  binds.post('/register', auth.register)
  binds.put('/update', access.user(), auth.update)
  binds.get('/logout', auth.logout)

  // installation

  // auth handled by the collaboration links
  binds.get('/installations', access.user(), installations.list)
  binds.post('/installations', access.user(), installations.create)

  // need to check access levels for these routes
  binds.get('/installations/:id', access.installation('viewer', 'path'), installations.get)
  binds.put('/installations/:id', access.installation('editor', 'path'), installations.save)
  binds.del('/installations/:id', access.installation('editor', 'path'), installations.delete)

  // thie is read-only because we are updating their user record
  binds.put('/installations/:id/activate', access.installation('viewer', 'path'), installations.activate)

  if(userRoutes) {
    const userRouteFactory = userRoutes(settings, controllers)
    userRouteFactory(app, access)
  }
}

module.exports = Routes