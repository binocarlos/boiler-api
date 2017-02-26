"use strict";

const urlparse = require('url').parse
const tools = require('boiler-api/src/tools')

const Resources = require('./resource')
const Clients = require('./client')

const Routes = (settings, controllers) => (app, access) => {

  const binds = tools.httpbinds(app, settings.base)

  const resources = Resources(controllers)
  const clients = Clients(controllers)

  // client
  binds.get('/clients', access.installation(), clients.list)
  binds.get('/clients/new', access.user(), clients.newdata)
  binds.post('/clients', access.installation('editor'), clients.create)
  binds.get('/clients/:id', access.client(), clients.get)
  binds.put('/clients/:id', access.client('editor'), clients.save)
  binds.del('/clients/:id', access.client('editor'), clients.delete)

  // resource
  binds.get('/resources', access.installation(), resources.list)
  binds.get('/resources/children', access.installation(), resources.children)
  binds.get('/resources/children/:id', access.installationLink('resource'), resources.children)
  binds.get('/resources/descendents', access.installation(), resources.descendents)
  binds.get('/resources/descendents/:id', access.installationLink('resource'), resources.descendents)
  binds.get('/resources/links/:id', access.installationLink('resource'), resources.links)

  binds.post('/resources', access.installation('editor'), resources.create)
  binds.post('/resources/:id', access.installationLink('resource', 'editor'), resources.create)
  binds.post('/resources/paste', access.installationLink('resource', 'editor'), resources.paste)
  binds.post('/resources/paste/:id', access.installationLink('resource', 'editor'), resources.paste)
  binds.get('/resources/:id', access.installationLink('resource'), resources.get)
  binds.put('/resources/:id', access.installationLink('resource', 'editor'), resources.save)
  binds.del('/resources/:id', access.installationLink('resource', 'editor'), resources.delete)
}

module.exports = Routes