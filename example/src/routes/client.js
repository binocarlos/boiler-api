"use strict";
const urlparse = require('url').parse
const async = require('async')

const tools = require('../tools')

function Clients(controllers) {

  const clients = controllers.client
  const connection = controllers.connection
  const transaction = controllers.transaction

  // QUERIES

  const get = (req, res, error) => {
    const clientID = tools.getIdParam(req)
    if(!clientID) return error('client id required')
    
    clients.get(connection(req), {
      params: {
        id: clientID
      }
    }, tools.jsonCallback(res, error))
  }

  const newdata = (req, res, error) => res.json(clients.newData())

  const list = (req, res, error) => {
    clients.list(connection(req), {
      params: {
        installationid: req.installationid
      }
    }, tools.jsonCallback(res, error))
  }

  // COMMANDS

  const create = (req, res, error) => {
    transaction(req, (db, finish) => {
      clients.create(db, {
        params: {
          installationid: req.installationid  
        },
        data: req.body
      }, finish)
    }, tools.jsonCallback(res, error, 201))
  }

  const save = (req, res, error) => {
    const clientID = tools.getIdParam(req)
    if(!clientID) return error('client id required')

    transaction(req, (db, finish) => {
      clients.save(db, {
        data: req.body,
        params: {
          id: clientID
        }
      }, finish)
    }, tools.jsonCallback(res, error))
  }

  const del = (req, res, error) => {
    const clientID = tools.getIdParam(req)
    if(!clientID) return error('client id required')

    transaction(req, (db, finish) => {
      clients.delete(db, {
        params: {
          id: clientID
        }
      }, finish)
    }, tools.jsonCallback(res, error))
  }

  return {
    get: get,
    newdata,
    list,
    create,
    save,
    delete: del
  }
}

module.exports = Clients