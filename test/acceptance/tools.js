"use strict";
const async = require('async')
const Request = require('request')
const request = Request.defaults({jar: true})

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:80'

const TRACER_ID = '1234'

const headers = () => {
  return {
    'x-tracer-id': TRACER_ID
  }
}

const url = (path) => {
  path = path || ''
  return BASE_URL + path
}

const UserData = (count) => {
  count = count || ''
  const ts = new Date().getTime()
  return {
    email: 'user' + ts + count + '@test.com',
    password: 'apples'
  }
}


const wrapResult = (done) => (err, res, body) => {
  if(err) return done(err)
  done(null, {
    statusCode: res.statusCode,
    body: body
  })
}

const register = (user, next) => {
  if(process.env.TRACE_TEST) {
    console.log('register')
  }
  request({
    method: 'POST',
    url: url('/api/v1/register'),
    headers: headers(),
    json: user
  }, wrapResult(next))
}

const login = (user, next) => {
  if(process.env.TRACE_TEST) {
    console.log('login')
  }
  request({
    method: 'POST',
    url: url('/api/v1/login'),
    headers: headers(),
    json: user
  }, wrapResult(next))
}

const logout = (next) => {
  if(process.env.TRACE_TEST) {
    console.log('logout')
  }
  request({
    method: 'GET',
    url: url('/api/v1/logout'),
    headers: headers(),
    followAllRedirects: true
  }, wrapResult(next))
}

const status = (next) => {
  if(process.env.TRACE_TEST) {
    console.log('status')
  }
  request({
    method: 'GET',
    url: url('/api/v1/status'),
    headers: headers(),
    json: true
  }, wrapResult(next))
}

const installations = (next) => {
  if(process.env.TRACE_TEST) {
    console.log('installations')
  }
  request({
    method: 'GET',
    url: url('/api/v1/installations'),
    headers: headers(),
    json: true
  }, wrapResult(next))
}

const createInstallation = (data, next) => {
  if(process.env.TRACE_TEST) {
    console.log('createInstallation')
  }
  request({
    method: 'POST',
    url: url('/api/v1/installations'),
    headers: headers(),
    json: data
  }, wrapResult(next))
}

const saveInstallation = (id, data, next) => {
  if(process.env.TRACE_TEST) {
    console.log('saveInstallation')
  }
  request({
    method: 'PUT',
    url: url('/api/v1/installations/' + id),
    headers: headers(),
    json: data
  }, wrapResult(next))
}

const getInstallation = (id, next) => {
  if(process.env.TRACE_TEST) {
    console.log('getInstallation')
  }
  request({
    method: 'GET',
    url: url('/api/v1/installations/' + id),
    headers: headers(),
    json: true
  }, wrapResult(next))
}

const deleteInstallation = (id, next) => {
  if(process.env.TRACE_TEST) {
    console.log('deleteInstallation')
  }
  request({
    method: 'DELETE',
    url: url('/api/v1/installations/' + id),
    headers: headers()
  }, wrapResult(next))
}

const activateInstallation = (id, next) => {
  if(process.env.TRACE_TEST) {
    console.log('activateInstallation')
  }
  request({
    method: 'PUT',
    url: url('/api/v1/installations/' + id + '/activate'),
    headers: headers()
  }, wrapResult(next))
}

const createClient = (installation, data, next) => {
  if(process.env.TRACE_TEST) {
    console.log('createClient')
  }
  request({
    method: 'POST',
    url: url('/api/v1/clients'),
    qs: {
      i: installation
    },
    headers: headers(),
    json: data
  }, wrapResult(next)) 
}

const listClients = (installation, next) => {
  if(process.env.TRACE_TEST) {
    console.log('listClients')
  }
  request({
    method: 'GET',
    url: url('/api/v1/clients'),
    qs: {
      i: installation
    },
    headers: headers(),
    json: true
  }, wrapResult(next)) 
}

const getClient = (installation, id, next) => {
  if(process.env.TRACE_TEST) {
    console.log('getClient')
  }
  request({
    method: 'GET',
    url: url('/api/v1/clients/' + id),
    qs: {
      i: installation
    },
    headers: headers(),
    json: true
  }, wrapResult(next)) 
}


const newClientData = (next) => {
  if(process.env.TRACE_TEST) {
    console.log('newClientData')
  }
  request({
    method: 'GET',
    url: url('/api/v1/clients/new'),
    headers: headers(),
    json: true
  }, wrapResult(next)) 
}

const saveClient = (installation, id, data, next) => {
  if(process.env.TRACE_TEST) {
    console.log('saveClient')
  }
  request({
    method: 'PUT',
    url: url('/api/v1/clients/' + id),
    qs: {
      i: installation
    },
    headers: headers(),
    json: data
  }, wrapResult(next))
}

const deleteClient = (installation, id, next) => {
  if(process.env.TRACE_TEST) {
    console.log('deleteClient')
  }
  request({
    method: 'DELETE',
    url: url('/api/v1/clients/' + id),
    qs: {
      i: installation
    },
    headers: headers()
  }, wrapResult(next))
}

const createResource = (installation, data, next) => {
  if(process.env.TRACE_TEST) {
    console.log('createResource')
  }
  request({
    method: 'POST',
    url: url('/api/v1/resources'),
    qs: {
      i: installation
    },
    headers: headers(),
    json: data
  }, wrapResult(next))
}

const appendResource = (installation, parentid, data, next) => {
  if(process.env.TRACE_TEST) {
    console.log('appendResource')
  }
  request({
    method: 'POST',
    url: url('/api/v1/resources/' + parentid),
    qs: {
      i: installation
    },
    headers: headers(),
    json: data
  }, wrapResult(next))
}

const listResources = (installation, qs, next) => {
  if(process.env.TRACE_TEST) {
    console.log('listResources')
  }
  request({
    method: 'GET',
    url: url('/api/v1/resources'),
    qs: Object.assign({}, qs, {
      i: installation
    }),
    headers: headers(),
    json: true
  }, wrapResult(next))
}


const getResource = (installation, id, qs, next) => {
  if(process.env.TRACE_TEST) {
    console.log('getResource')
  }
  request({
    method: 'GET',
    url: url('/api/v1/resources/' + id),
    qs: Object.assign({}, qs, {
      i: installation
    }),
    headers: headers(),
    json: true
  }, wrapResult(next))
}

const getResourceLinks = (installation, id, qs, next) => {
  if(process.env.TRACE_TEST) {
    console.log('getResourceLinks')
  }
  request({
    method: 'GET',
    url: url('/api/v1/resources/links/' + id),
    qs: Object.assign({}, qs, {
      i: installation
    }),
    headers: headers(),
    json: true
  }, wrapResult(next))
}

const resourceChildren = (installation, id, qs, next) => {
  if(process.env.TRACE_TEST) {
    console.log('listResources')
  }
  request({
    method: 'GET',
    url: url('/api/v1/resources/children' + (id ? '/' + id : '')),
    qs: Object.assign({}, qs, {
      i: installation
    }),
    headers: headers(),
    json: true
  }, wrapResult(next))
}

const resourceDescendents = (installation, id, qs, next) => {
  if(process.env.TRACE_TEST) {
    console.log('resourceDescendents')
  }
  request({
    method: 'GET',
    url: url('/api/v1/resources/descendents' + (id ? '/' + id : '')),
    qs: Object.assign({}, qs, {
      i: installation
    }),
    headers: headers(),
    json: true
  }, wrapResult(next))
}

const saveResource = (installation, id, data, next) => {
  if(process.env.TRACE_TEST) {
    console.log('saveResource')
  }
  request({
    method: 'PUT',
    url: url('/api/v1/resources/' + id),
    qs: {
      i: installation
    },
    headers: headers(),
    json: data
  }, wrapResult(next))
}

const deleteResource = (installation, id, next) => {
  if(process.env.TRACE_TEST) {
    console.log('deleteResource')
  }
  request({
    method: 'DELETE',
    url: url('/api/v1/resources/' + id),
    qs: {
      i: installation
    },
    headers: headers(),
    json: true
  }, wrapResult(next))
}

const copyResources = (installation, target, ids, next) => {
  if(process.env.TRACE_TEST) {
    console.log('copyResources')
  }
  request({
    method: 'POST',
    url: url('/api/v1/resources/paste/' + target),
    qs: {
      i: installation,
      copy: ids.join(',')
    },
    headers: headers(),
    json: true
  }, wrapResult(next))
}

const badCopyResources = (installation, target, ids, next) => {
  if(process.env.TRACE_TEST) {
    console.log('badCopyResources')
  }
  request({
    method: 'POST',
    url: url('/api/v1/resources/paste/' + target),
    qs: {
      i: installation,
      mode: 'copy',
      ids: {
        value: []
      }
    },
    headers: headers(),
    json: true
  }, wrapResult(next))
}

const cutResources = (installation, target, ids, next) => {
  if(process.env.TRACE_TEST) {
    console.log('cutResources')
  }
  request({
    method: 'POST',
    url: url('/api/v1/resources/paste/' + target),
    qs: {
      i: installation,
      cut: ids.join(',')
    },
    headers: headers(),
    json: true
  }, wrapResult(next))
}

module.exports = {
  UserData,
  request,
  url,
  register,
  wrapResult,
  headers,
  register,
  login,
  logout,
  status,
  installations,
  createInstallation,
  saveInstallation,
  getInstallation,
  deleteInstallation,
  activateInstallation,
  createClient,
  listClients,
  getClient,
  newClientData,
  saveClient,
  deleteClient,
  createResource,
  appendResource,
  saveResource,
  listResources,
  getResource,
  getResourceLinks,
  resourceChildren,
  resourceDescendents,
  deleteResource,
  copyResources,
  badCopyResources,
  cutResources
}