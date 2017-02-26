"use strict";

const Resource = require('./resource')
const Client = require('./client')

const Controllers = (dbclient, eventBus, userFactory) => {

  const connection = dbclient.connection
  const transaction = dbclient.transaction

  const resource = Resource(eventBus)
  const client = Client(eventBus)
  
  return {
    resource,
    client
  }
}


module.exports = Controllers