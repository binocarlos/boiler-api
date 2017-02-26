"use strict";

const User = require('./user')
const Installation = require('./installation')
const CommandLog = require('./commandlog')
const Utils = require('./utils')

const Controllers = (dbclient, eventBus, userFactory) => {

  const connection = dbclient.connection
  const transaction = dbclient.transaction

  const user = User(eventBus)
  const installation = Installation(eventBus)
  const commandlog = CommandLog(eventBus)
  const utils = Utils(eventBus)

  const coreControllers = return {
    connection,
    transaction,
    user,
    installation,
    commandlog,
    utils
  }

  const userControllers = userFactory ?
    userFactory(dbclient, eventBus) :
    {}

  return Object.assign({}, coreControllers, userControllers)  
}


module.exports = Controllers