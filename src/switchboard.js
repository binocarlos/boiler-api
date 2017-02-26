"use strict";

const async = require('async')
const Logger = require('./logger')

const logger = Logger('switchboard')

function Switchboard(controllers, eventBus, UserCommands) {

  const commandlog = controllers.commandlog
  const installation = controllers.installation
  const user = controllers.user

  const SYSTEM_COMMANDS = {

  }

  const USER_COMMANDS = UserCommands ?
    UserCommands(controllers) :
    {}

  const COMMANDS = Object.assign({}, SYSTEM_COMMANDS, USER_COMMANDS)

  // LISTENERS

  // log every event
  eventBus.listen((db, event, done) => {
    logger.debug('event', db.tracer, {
      event
    })
    done()
  })

  // for every command - insert a command log
  eventBus.listen((db, event, done) => {
    if(event.type == 'command') {
      commandlog.create(db, {
        data: event
      }, done)  
    }
    else {
      done()
    }
  })

  // main command reactor
  eventBus.listen((db, event, done) => {
    if(event.type != 'command') return done()
    const handlers = COMMANDS[event.channel] || []
    async.series(handlers.map(handler => next => handler(db, event, next)), done) 
  })
}

module.exports = Switchboard