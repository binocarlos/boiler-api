"use strict";

// imports
const Logger = require('./logger')

const tools = require('./tools')

const Postgres = require('./database/postgres')
const Redis = require('./database/redis')
const PostgresClient = require('./database/client')

const Session = require('./webserver/session')
const Passport = require('./webserver/passport')
const App = require('./webserver/app')

const AccessControl = require('./access')
const EventBus = require('./eventBus')
const Controllers = require('./controllers')
const Switchboard = require('./switchboard')
const Routes = require('./routes')

const coresettings = require('./settings')

const appFactory = (opts) => {
  opts = opts || {}

  const settings = Object.assign({}, coresettings, opts.settings)

  if(!opts.noSettingsCheck && (!settings.postgresuser || !settings.postgrespassword)) {
    console.error('postgresuser and postgrespassword required')
    process.exit(1)
  }

    // database setup
  const postgres = Postgres({
    user: settings.postgresuser,
    database: settings.postgresdatabase,
    password: settings.postgrespassword,
    host: settings.postgreshost,
    port: settings.postgresport
  })

  const redis = Redis({
    host: settings.redishost,
    port: settings.redisport,
    db: settings.redisdatabase
  })

  const session = Session(redis, {
    prefix: settings.redisprefix,
    secret: settings.cookiesecret
  })

  // tooling
  const eventBus = EventBus()
  const postgresClient = PostgresClient(postgres)
  const controllers = Controllers(postgresClient, eventBus, opts.controllers)
  const switchboard = Switchboard(controllers, eventBus, opts.switchboard)

  const passport = Passport(controllers)
  const app = App({
    session,
    passport
  })

  // routes
  const access = AccessControl(settings, controllers, opts.access)
  const routes = Routes(settings, controllers, opts.routes)
  


  routes(app, access)
  app.use(tools.errorHandler)

  // boot
  const logger = Logger('core')

  return {
    app,
    postgres,
    redis,
    eventBus,
    postgresClient,
    controllers,
    switchboard,
    start: () => {
      app.listen(settings.port, () => {
        logger.info('booted:webserver', 'system')
      })
    }
  }
}

module.exports = appFactory