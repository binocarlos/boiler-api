"use strict";

const urlparse = require('url').parse
const async = require('async')

const tools = require('boiler-api/src/tools')

// authorization rules
const AccessControl = (settings, controllers, base) => {
  
  const connection = controllers.connection
  const installations = controllers.installation
  const clients = controllers.client


  /*
  
    client
    
  */

  // checking the client means:
  //
  //  * check for access level to the installation
  //  * check the client lives in the installation
  const client = (requiredAccess) => {

    const installationChecker = base.installation(requiredAccess)

    return (req, res, next) => {

      const clientid = tools.getIdParam(req)
      if(!clientid) return base.tools.replyNoParam('clientid', next)

      // first check the users access to the installation itself
      installationChecker(req, res, (err) => {

        // return the plain error because the installation checker has already processed it
        if(err) return next(err)

        // now check that the given client lives in that installation
        clients.hasInstallation(connection(req), {
          params: {
            clientid: clientid,
            installationid: req.installationid
          }
        }, (err, hasClient) => {
          if(err) return base.tools.replyError(err, next)
          if(!hasClient) return base.tools.replyNoAccess(next)
          next()
        })

      })
    }
  }

  return {
    client
  }
}

module.exports = AccessControl