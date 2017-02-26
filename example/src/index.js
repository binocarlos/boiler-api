"use strict";

const AppFactory = require('boiler-api')
const controllers = require('./controllers')
const routes = require('./routes')
const switchboard = require('switchboard')
const access = require('access/control')
const settings = require('./settings')

const app = AppFactory({
  controllers,
  routes,
  access,
  switchboard
})

app.start()