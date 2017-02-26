"use strict";
const ExpressSession = require('express-session')
const RedisStore = require('connect-redis')(ExpressSession)

function Session(client, settings) {
  const store = new RedisStore({
    client: client,
    prefix: settings.prefix
  })

  return ExpressSession({
    store: store,
    secret: settings.secret,
    resave: false,
    saveUninitialized: true
  })
}


module.exports = Session