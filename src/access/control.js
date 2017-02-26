"use strict";

const urlparse = require('url').parse
const async = require('async')

const canAccess = require('./levels')
const tools = require('../tools')

/*
  
  general tools
  
*/
const replyNoUser = (next) => next(['user required', 403])
const replyNoParam = (name, next) => next([name + ' required', 403])
const replyNoAccess = (next) => next(['insufficient access level', 403])
const replyError = (err, next) => next([err.toString(), 500])

// authorization rules
const AccessControl = (settings, controllers, opts) => {
  
  const connection = controllers.connection
  const installations = controllers.installation
  const clients = controllers.client
  const utils = controllers.utils

  opts = opts || {}

  /*
  
    user
    
  */

  // a logged in user is required
  const user = (opts) => (req, res, next) => {
    if(!req.userid) return replyNoUser(next)
    next()
  }

  /*
  
    installation
    
  */
  
  const installation = (requiredAccess, usePathExtractor) => {
    return (req, res, next) => {

      // if there is no user they can have no access to an installation
      if(!req.userid) return replyNoUser(next)

      // are we using a /api/v1/installation route?
      // in which case extract the id using the req.params and not
      // req.installationid (which has been populated by the webserver/paramMiddleware)
      const installationid = usePathExtractor ?
        tools.getIdParam(req) :
        req.installationid

      // we need an installationid somehow
      if(!installationid) return replyNoParam('installation id', next)

      req.installationid = installationid

      // get the actual access level the user has on the installation
      installations.accessLevel(connection(req), {
        params: {
          accountid: req.userid,
          installationid
        }
      }, (err, userAccess) => {
        if(err) return replyError(err, next)

        // get the base access for a certain installation
        // for example we can say the system installation is read-only for everyone
        if(!userAccess && opts.getInstallationAccess) {
          userAccess = opts.getInstallationAccess(installationid)
        }

        // compare the actual access level to the required on
        if(!canAccess(requiredAccess, userAccess)) {

          // the user cannot access this installation - use a route 
          return replyNoAccess(next)
        }
        
        // write the installation access levels to the req for the route to consume
        req.installationAccess = userAccess

        next()
      })
    }
  }

  /*
  
    installation_link
    
  */

  // checking the installation_link means:
  //
  //  * check for access level to the installation
  //  * check the table -> id has an installation set to the current installation
  const installationLink = (table, requiredAccess) => {

    const installationChecker = installation(requiredAccess)

    return (req, res, next) => {

      const id = tools.getIdParam(req)
      if(!id) return replyNoParam('entityId', next)

      // first check the users access to the installation itself
      installationChecker(req, res, (err) => {

        // return the plain error because the installation checker has already processed it
        if(err) return next(err)

        utils.entityInstallationId(connection(req), {
          params: {
            table,
            id
          }
        }, (err, installationid) => {
          if(err) return replyError(err, next)

          // if the entity is of a different installation then deny
          if(installationid != req.installationid) replyNoAccess(next)
          next()
        })

      })
    }
  }

  return {
    user,
    installation,
    installationLink,
    tools: {
      replyNoUser,
      replyNoParam,
      replyNoAccess,
      replyError
    }
  }
}

module.exports = AccessControl