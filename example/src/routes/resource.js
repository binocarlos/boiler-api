"use strict";
const urlparse = require('url').parse
const async = require('async')

const tools = require('boiler-api/src/tools')

function Resources(controllers) {

  const resources = controllers.resource
  const connection = controllers.connection
  const transaction = controllers.transaction

  // QUERIES

  const get = (req, res, error) => {
    const resourceID = tools.getIdParam(req)
    if(!resourceID) return error('resource id required')
    resources.get(connection(req), {
      params: {
        installationid: req.installationid,
        id: resourceID,
        links: req.qs.links || null
      }
    }, tools.jsonCallback(res, error))
  }

  const list = (req, res, error) => {
    resources.list(connection(req), {
      params: {
        installationid: req.installationid,
        type: req.qs.type || null,
        search: req.qs.search || null
      }
    }, tools.jsonCallback(res, error))
  }

  const children = (req, res, error) => {

    const parentID = tools.getIdParam(req)

    resources.children(connection(req), {
      params: {
        installationid: req.installationid,
        id: parentID,
        type: req.qs.type || null,
        search: req.qs.search || null,
        links: req.qs.links || null
      }
    }, tools.jsonCallback(res, error))
  }

  const descendents = (req, res, error) => {

    const parentID = tools.getIdParam(req)

    resources.descendents(connection(req), {
      params: {
        installationid: req.installationid,
        id: parentID,
        type: req.qs.type || null,
        search: req.qs.search || null
      }
    }, tools.jsonCallback(res, error))
  }

  const links = (req, res, error) => {

    const parentID = tools.getIdParam(req)

    resources.links(connection(req), {
      params: {
        installationid: req.installationid,
        id: parentID,
        follow: req.qs.follow || null
      }
    }, tools.jsonCallback(res, error))
  }

  // COMMANDS

  const create = (req, res, error) => {
    const parentID = tools.getIdParam(req)

    transaction(req, (db, finish) => {
      resources.create(db, {
        params: {
          installationid: req.installationid,
          parentid: parentID
        },
        data: req.body
      }, finish)
    }, tools.jsonCallback(res, error, 201))
  }

  const paste = (req, res, error) => {
    const parentID = tools.getIdParam(req)

    const mode = req.qs.copy ?
      'copy' :
      'cut'

    const ids = (req.qs[mode] || '')
      .split(',')
      .map(id => {
        return parseInt(id.replace(/\D/g, ''))
      })
      .filter(id => isNaN(id) ? false : true)
    
    if(ids.length <= 0 || !mode) {
      return error('no copy or cut ids passed')
    }

    transaction(req, (db, finish) => {
      resources.paste(db, {
        params: {
          mode,
          ids,
          installationid: req.installationid,
          parentid: parentID
        }
      }, finish)
    }, tools.jsonCallback(res, error, 201))
  }

  const save = (req, res, error) => {
    const resourceID = tools.getIdParam(req)
    if(!resourceID) return error('resource id required')

    transaction(req, (db, finish) => {
      resources.save(db, {
        data: req.body,
        params: {
          id: resourceID
        }
      }, finish)
    }, tools.jsonCallback(res, error))
  }

  const del = (req, res, error) => {
    const resourceID = tools.getIdParam(req)
    if(!resourceID) return error('resource id required')
    transaction(req, (db, finish) => {
      resources.delete(db, {
        params: {
          id: resourceID
        }
      }, finish)
    }, tools.jsonCallback(res, error))
  }

  return {
    get: get,
    list,
    children,
    links,
    descendents,
    create,
    save,
    paste,
    delete: del
  }
}

module.exports = Resources