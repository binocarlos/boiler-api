"use strict";
const urlparse = require('url').parse
const async = require('async')

const tools = require('../tools')

function Installations(controllers) {

  const installations = controllers.installation
  const connection = controllers.connection
  const transaction = controllers.transaction

  // QUERIES

  const get = (req, res, error) => {

    const installationID = tools.getIdParam(req)
    if(!installationID) return error('installation id required')
    
    installations.get(connection(req), {
      params: {
        id: installationID
      }
    }, tools.jsonCallback(res, error))
  }

  const list = (req, res, error) => {
    installations.list(connection(req), {
      params: {
        accountid: req.userid
      }
    }, tools.jsonCallback(res, error))
  }

  // COMMANDS

  const create = (req, res, error) => {
    transaction(req, (db, finish) => {
      installations.create(db, {
        data: req.body,
        params: {
          accountid: req.userid,  
        }
      }, finish)
    }, tools.jsonCallback(res, error, 201))
  }

  const save = (req, res, error) => {
    const installationID = tools.getIdParam(req)
    if(!installationID) return error('installation id required')

    req.installationid = installationID
  
    transaction(req, (db, finish) => {
      installations.save(db, {
        data: req.body,
        params: {
          id: installationID
        }
      }, finish)
    }, tools.jsonCallback(res, error))
  }

  const activate = (req, res, error) => {

    const installationID = tools.getIdParam(req)
    if(!installationID) return error('installation id required')

    req.installationid = installationID

    transaction(req, (db, finish) => {
      installations.activate(db, {
        params: {
          installationid: installationID,
          accountid: req.userid  
        }
      }, finish)
    }, tools.jsonCallback(res, error))
  }

  const del = (req, res, error) => {

    const installationID = tools.getIdParam(req)
    if(!installationID) return error('installation id required')

    req.installationid = installationID

    transaction(req, (db, finish) => {
      installations.delete(db, {
        params: {
          id: installationID
        }
      }, finish)
    }, tools.jsonCallback(res, error))
  }

  return {
    get: get,
    list,
    create,
    save,
    activate,
    delete: del
  }
}

module.exports = Installations