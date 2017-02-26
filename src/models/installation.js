"use strict";
const async = require('async')
const SQL = require('../database/sql')
const selectors = require('../database/selectors')

const prepareData = (installation) => {
  return installation.meta ?
    Object.assign({}, installation, {
      meta: JSON.stringify(installation.meta)
    }) :
    installation
}

const defaultInstallation = () => {
  return {
    name: 'My First Company',
    meta: {}
  }
}

const QUERIES = {

  byUser: (accountid) => {
    const params = [accountid]
    const sql = `select installation.*, collaboration.permission
from
  installation
join
  collaboration
on
  (collaboration.installation = installation.id)
where
  collaboration.useraccount = $1
order by
  installation.name
`
    return {
      sql,
      params
    }
  },
  get: (params) => SQL.select('installation', params),
  save: (data, params) => SQL.update('installation', data, params),
  delete: (params) => SQL.delete('installation', params),
  insert: (data) => SQL.insert('installation', data),
  getCollaboration: (params) => SQL.select('collaboration', params),
  insertCollaboration: (accountid, installationid, permission) => {
    permission = permission || 'owner'
    return SQL.insert('collaboration', {
      'useraccount': accountid,
      'installation': installationid,
      'permission': permission
    })
  }
}

const get = (runQuery, query, done) => runQuery(QUERIES.get(query.params), selectors.single(done))

const accessLevel = (runQuery, query, done) => {
  runQuery(QUERIES.getCollaboration({
    useraccount: query.params.accountid,
    installation: query.params.installationid
  }), selectors.field('permission', done))
}

//  * accountid
const byUser = (runQuery, query, done) => runQuery(QUERIES.byUser(query.params.accountid), selectors.rows(done))

//  * data
//    * name
//    * meta
//  * params
//    * accountid
const create = (runQuery, query, done) => {
  const accountid = query.params.accountid

  let data = query.data == 'default' ?
    defaultInstallation(accountid) :
    query.data

  data = prepareData(data)
  let newObjects = {
    installation: null,
    collaboration: null
  }

  async.waterfall([

    (next) => runQuery(QUERIES.insert(data), selectors.single(next)),
    (installation, next) => {
      newObjects.installation = installation
      runQuery(QUERIES.insertCollaboration(accountid, installation.id), selectors.single(next))
    },
    (collaboration, next) => {
      newObjects.collaboration = collaboration
      next()
    }

  ], (err) => {
    if(err) return done(err)
    done(null, newObjects.installation)
  })
}

//  * params
//  * data
//    * name
//    * meta
const save = (runQuery, query, done) => runQuery(SQL.update('installation', prepareData(query.data), query.params), done)

//  * params
//    * id
const del = (runQuery, query, done) => runQuery(SQL.delete('installation', query.params), selectors.single(done))

module.exports = {
  QUERIES,
  get: get,
  byUser,
  accessLevel,
  create,
  save,
  delete: del
}