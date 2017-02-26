"use strict";

const async = require('async')

function Switchboard(controllers, eventBus) {

  const commandlog = controllers.commandlog
  const installation = controllers.installation
  const user = controllers.user

  const COMMANDS = {

    // when the user registers - create a default installation
    'user.register': [
      (db, event, next) => {
        installation.createDefault(db, {
          params: {
            accountid: event.result.id  
          }
        }, next)
      }
    ]
  }

  return COMMANDS
}

module.exports = Switchboard