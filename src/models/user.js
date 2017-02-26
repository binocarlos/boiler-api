"use strict";

const async = require('async')
const tools = require('../tools')
const SQL = require('../database/sql')
const selectors = require('../database/selectors')

const PRIVATE_FIELDS = {
  hashed_password: true,
  salt: true
}

const QUERIES = {
  get: (params) => {
    if(!params) throw new Error('no params for query')
    return SQL.select('useraccount', params)
  },
  insert: (data) => SQL.insert('useraccount', data),
  update: (params, data) => SQL.update('useraccount', data, params),
  delete: (params) => SQL.delete('useraccount', params),
}

// remove sensitive fields
const cleanData = (data) => {
  return Object.keys(data || {})
    .filter(f => PRIVATE_FIELDS[f] ? false : true)
    .reduce((all, key) => {
      all[key] = data[key]
      return all
    }, {})
}

const prepareData = (user) => {
  const meta = user.meta || {}
  return Object.assign({}, user, {
    meta: typeof(meta) == 'string' ?
      meta :
      JSON.stringify(meta)
  })
}

// QUERIES

const get = (runQuery, query, done) => runQuery(QUERIES.get(query.params), selectors.single(done))
const getClean = (runQuery, query, done) => runQuery(QUERIES.get(query.params), selectors.single(done, cleanData))

// COMMANDS

// login query
// 1. load user with email using crud.get
// 2. encrypt plain text password using loaded salt
// 3. compare both encrypted passwords
// query:
//  * data
//    * email
//    * password
const login = (runQuery, query, done) => {
  const data = query.data
  const email = data.email
  const password = data.password
  get(runQuery, {
    params: {
      email
    }
  }, (err, user) => {
    if(err) return done(err)
    if(!user) return done()
    done(null, tools.checkUserPassword(user, password) ? cleanData(user) : null)
  })
}

// models.user.register - register user transaction
// 1. check the primary key does not exist
// 2. insert
// query:
//  * data
//    * email
//    * password
const register = (runQuery, query, done) => {
  const data = query.data
  const userData = tools.generateUser(data)
  async.waterfall([
    (next) => {
      runQuery(QUERIES.get({ 
        email: data.email
      }), selectors.single(next))
    },
    (existingUser, next) => {
      if(existingUser) return next(data.email + ' already exists')
      runQuery(QUERIES.insert(prepareData(userData)), selectors.single(next))
    }
  ], (err, newUser) => {
    if(err) return done(err)
    done(null, cleanData(newUser))
  })
}

//  * data
//    * email
//    * meta
//  * params
const save = (runQuery, query, done) => runQuery(QUERIES.update(query.params, query.data), selectors.single(done, cleanData))
const del = (runQuery, query, done) => runQuery(QUERIES.delete(query.params), selectors.single(done, cleanData))

module.exports = {
  login,
  register,
  save,
  get: get,
  delete: del,
  getClean: getClean,
  clean: cleanData
}