"use strict";
const passport = require('passport')
const Logger = require('../logger')
const logger = Logger('passport')
function Passport(controllers) {

  const users = controllers.user
  const connection = controllers.connection

  passport.serializeUser((req, user, done) => {
    logger.trace('serializeUser', req.id, {
      user
    })
    done(null, user.id)
  })
  passport.deserializeUser((req, id, done) => {
    users.get(connection({
      id: req.id,
      user: {
        id
      }
    }), {
      params: {
        id  
      }
    }, (err, user) => {
      if(err){
        logger.error('deserializeUser', req.id, {
          id: id,
          error: err.toString()
        })
        return done(err)
      }
      logger.trace('deserializeUser', req.id, {
        id: id,
        user
      })
      done(null, user)
    })
  })
    
  return passport
}

module.exports = Passport