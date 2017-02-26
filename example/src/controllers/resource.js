"use strict";

const async = require('async')
const tools = require('boiler-api/src/tools')

const ResourceModel = require('../models/resource')

const ResourceController = (eventBus) => {
  
  // queries
  const get = (db, query, done) => ResourceModel.get(db.run, query, done)
  const list = (db, query, done) => ResourceModel.list(db.run, query, done)
  const children = (db, query, done) => ResourceModel.children(db.run, query, done)
  const links = (db, query, done) => ResourceModel.links(db.run, query, done)
  const descendents = (db, query, done) => ResourceModel.descendents(db.run, query, done)

  // commands
  //   * params
  //     * installationid
  //   * data
  //     * name
  //     * type
  //     * labels[][]
  //     * meta
  //     * children[resource]
  const create = (db, query, done) => {

    async.waterfall([

      (next) => {
        ResourceModel.create(db.run, query, next)
      },

      (result, next) => {
        eventBus.emit(db, {
          type: 'command',
          channel: 'resource.create',
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
        ResourceModel.save(db.run, query, next)
      },

      (result, next) => {
        eventBus.emit(db, {
          type: 'command',
          channel: 'resource.save',
          query,
          result
        }, next)
      }
    ], done)
  }

  const del = (db, query, done) => {

    async.waterfall([

      (next) => {
        ResourceModel.delete(db.run, query, next)
      },

      (result, next) => {
        eventBus.emit(db, {
          type: 'command',
          channel: 'resource.delete',
          query,
          result
        }, next)
      }
    ], done)
    
  }

  // * load the sub-tree of each thing being pasted
  // * strip sub-tree of path
  // * add sub-tree to target
  // * if cut delete existing sub-tree

  // params
  //  * installationid
  //  * parentid
  //  * ids
  //  * mode {cut,copy}

  const paste = (db, query, done) => {

    const params = query.params
    const ids = params.ids || []
    const installationid = params.installationid
    const parentid = params.parentid
    const mode = params.mode

    const allResults = {}

    if(ids.length <= 0) return done('no ids passed')

    async.series([

      // load the tree for each resource id being pasted
      (next) => {
        async.parallel(ids.map(id => nextresource => {
          async.waterfall([
            (nextpart) => ResourceModel.get(db.run, {params:{id}}, nextpart),
            (resource, nextpart) => {
              ResourceModel.tree(db.run, {params:{installationid: resource.installation, id}}, (err, tree) => {
                if(err) return nextpart(err)
                nextpart(null, {
                  item: resource,
                  tree
                })
              })
            }
          ], (err, results) => {
            if(err) return nextresource(err)
            if(!results.item) return nextresource('no item found')
            const item = results.item
            item.children = results.tree || []
            nextresource(null, item)
          })
        }), (err, results) => {
          if(err) return next(err)
          allResults.originalItems = results
          allResults.sourceItems = results.map(item => ResourceModel.stripTreeFields(item, mode == 'copy' ? true : false))
          next()
        })
      },

      // if we are cutting - remove the source items
      // (we are in a transaction so it's ok)
      (next) => {
        if(mode == 'copy') {
          return next()
        }
        async.parallel(allResults.sourceItems.map(item => nextresource => {
          ResourceModel.delete(db.run, {
            params: {
              id: item.id
            }
          }, nextresource)
        }), (err, results) => {
          if(err) return next(err)
          allResults.deleteItems = results
          next()
        })
      },

      // add each thing to target
      (next) => {
        async.parallel(allResults.sourceItems.map(item => nextresource => {
          ResourceModel.create(db.run, {
            params: {
              installationid,
              parentid
            },
            data: item
          }, nextresource)
        }), (err, results) => {
          if(err) return next(err)
          allResults.targetItems = results
          next()
        })
      },

      (next) => {        
        eventBus.emit(db, {
          type: 'command',
          channel: 'resource.paste',
          query,
          result: allResults
        }, next)
      }
    ], err => {
      if(err) return done(err)
      done(null, allResults)
    })
    
  }

  return {
    get: get,
    list,
    children,
    descendents,
    links,
    create,
    save,
    paste,
    delete: del
  }
}

module.exports = ResourceController