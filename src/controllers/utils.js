"use strict";

const async = require('async')
const tools = require('../tools')

const UtilsModel = require('../models/utils')

const UtilsController = (eventBus) => {
  
  // queries

  // get the installation id for a generic entity used for access control
  //
  // * params
  //   * table
  //   * id
  const entityInstallationId = (db, query, done) => UtilsModel.entityInstallationId(db.run, query, done)

  return {
    entityInstallationId
  }
}

module.exports = UtilsController