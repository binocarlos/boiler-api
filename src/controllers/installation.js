"use strict";

const async = require('async')
const tools = require('../tools')

const InstallationModel = require('../models/installation')
const UserModel = require('../models/user')

const InstallationController = (eventBus) => {
  
  // queries
  const get = (db, query, done) => InstallationModel.get(db.run, query, done)
  const list = (db, query, done) => InstallationModel.byUser(db.run, query, done)
  const accessLevel = (db, query, done) => InstallationModel.accessLevel(db.run, query, done)

  // commands
  const create = (db, query, done) => {

    async.waterfall([

      (next) => {
        InstallationModel.create(db.run, query, next)
      },

      (result, next) => {
        db.setValue('installationid', result.id)
        eventBus.emit(db, {
          type: 'command',
          channel: 'installation.create',
          query,
          result
        }, next)
      }

    ], done)
    
  }

  // update the user with a 'active' installation (written to the user data)
  // query:
  //   * params
  //     * installationid
  //     * accountid
  const activate = (db, query, done) => {

    async.waterfall([

      (next) => UserModel.get(db.run, {
        params: {
          id: query.params.accountid
        }
      }, next),

      (user, next) => {
      
        const newMeta = Object.assign({}, user.meta, {
          activeInstallation: query.params.installationid
        })

        UserModel.save(db.run, {
          data: {
            meta: newMeta
          },
          params: {
            id: query.params.accountid
          }
        }, next)
      },

      (result, next) => {
        eventBus.emit(db, {
          type: 'command',
          channel: 'installation.activate',
          query,
          result
        }, next)
      }
      
    ], done)
  }

  // * params
  //    * accountid
  const createDefault = (db, query, done) => {
    const accountid = query.params.accountid

    async.waterfall([

      (next) => {
        create(db, {
          data: 'default',
          params: {
            accountid  
          }
        }, next)
      },
        
      (installationData, next) => {

        activate(db, {
          params: {
            installationid: installationData.id,
            accountid  
          }
        }, next)
      }

    ], done)
  }

  // * data
  // * params
  const save = (db, query, done) => {

    async.waterfall([

      (next) => {
        InstallationModel.save(db.run, query, next)
      },

      (result, next) => {
        eventBus.emit(db, {
          type: 'command',
          channel: 'installation.save',
          query,
          result
        }, next)
      }
    ], done)
  }

  const del = (db, query, done) => {

    async.waterfall([

      (next) => {
        InstallationModel.delete(db.run, query, next)
      },

      (result, next) => {
        eventBus.emit(db, {
          type: 'command',
          channel: 'installation.delete',
          query,
          result
        }, next)
      }
    ], done)
    
  }

  return {
    list,
    accessLevel,
    create,
    createDefault,
    activate,
    save,
    delete: del,
    get: get
  }
}

module.exports = InstallationController