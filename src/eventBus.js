"use strict";

/*

  an async eventBus

  we want to de-couple commands that run as a result of a HTTP request
  from the commands that react to that original command

  a good example is account registration - we want to create a default installation
  when a user registers an account but we don't want to make the assumption
  that will be the case for every system

  we use the switchboard to turn on and off these reactive commands

  however - when the user is registered, we are inside a transaction and have
  an active database client for that transaction

  this client should be used for all reactive commands so they can all be within the
  same transaction (if the default installation fails then the user account is rolled back)

  the only way to do this is to have asynchronous event handlers that are passed an
  active database connection and ALWAYS run the callback when finished

  then - when command events are emitted, the original controller will wait for
  the switchboard to say 'all command events have completed successfully' before
  we complete and commit the transaction

  this is different to the job queue

  the job queue is a truely asynchronous de-coupled system

  the event bus is tightly coupled to the machine / transaction 
  
*/

const async = require('async')

function EventBus() {
  const listeners = []

  const emit = (db, event, done) => {
    const handlers = listeners.map(listener => {
      return (next) => {
        listener(db, event, next) 
      }
    })
    async.series(handlers, (err) => done(err, event.result))
  }

  const listen = (handler) => listeners.push(handler)

  const bus = {
    emit,
    listen
  }

  return bus
}

module.exports = EventBus