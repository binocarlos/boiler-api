"use strict";

const async = require('async')
const tools = require('../tools')

const ClientModel = require('../models/client')
const UserModel = require('../models/user')

const ClientController = (eventBus) => {
  
  // queries
  const get = (db, query, done) => ClientModel.get(db.run, query, done)
  const list = (db, query, done) => ClientModel.list(db.run, query, done)
  const hasInstallation = (db, query, done) => ClientModel.hasInstallation(db.run, query, done)

  // data for a new client
  const newData = () => {
    return {
      email: tools.getRandomEmail(),
      password: tools.getRandomPassword(),
      meta: {
        name: ''
      }
    }
  }
  
  // commands
  //   * params
  //     * installationid
  //   * data
  //     * email
  //     * password
  //     * meta
  const create = (db, query, done) => {

    async.waterfall([

      (next) => {
        ClientModel.create(db.run, query, next)
      },

      (result, next) => {
        eventBus.emit(db, {
          type: 'command',
          channel: 'client.create',
          query,
          result
        }, next)
      }

    ], done)
    
  }

  // * data
  // * params
  const save = (db, query, done) => {

    async.waterfall([

      (next) => {
        ClientModel.save(db.run, query, next)
      },

      (result, next) => {
        eventBus.emit(db, {
          type: 'command',
          channel: 'client.save',
          query,
          result
        }, next)
      }
    ], done)
  }

  const del = (db, query, done) => {

    async.waterfall([

      (next) => {
        ClientModel.delete(db.run, query, next)
      },

      (result, next) => {
        eventBus.emit(db, {
          type: 'command',
          channel: 'client.delete',
          query,
          result
        }, next)
      }
    ], done)
    
  }

  return {
    newData: newData,
    get: get,
    hasInstallation,
    list,
    create,
    save,
    delete: del
  }
}

module.exports = ClientController