"use strict";

const async = require('async')
const tools = require('../tools')
const SQL = require('../database/sql')
const selectors = require('../database/selectors')

const QUERIES = {
  entityInstallationId: (params) => SQL.select(params.table, {
    id: params.id
  })
}


// QUERIES

const entityInstallationId = (runQuery, query, done) => runQuery(QUERIES.entityInstallationId(query.params), selectors.field('installation', done))

module.exports = {
  entityInstallationId
}