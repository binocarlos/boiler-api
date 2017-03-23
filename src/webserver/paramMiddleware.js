"use strict";

/*

  extract userid and installationid params into the req

  this makes it easy for auth assertions and logging to know
  the user and installation
  
*/

const urlparse = require('url').parse
const settings = require('../settings')
const INSTALLATIONID_QUERY_FIELDS = ['i', 'installation', 'installationid']

// extract a numeric id from an array of query-strings
// first result matches
const queryParam = (names) => (req) => {
  const qs = req.qs || urlparse(req.url, true).query
  let id = names
    .map(f => qs[f])
    .filter(v => v)[0]
  if(id == 'system') return id
  return isNaN(parseInt(id)) ? null : parseInt(id)
}

const installationQuery = queryParam(INSTALLATIONID_QUERY_FIELDS)

const ParamMiddleware = (opts) => (req, res, next) => {
  req.userid = req.user ? req.user.id : null
  req.qs = urlparse(req.url, true).query

  if(!opts.extractInstallation) {
    req.installationid = installationQuery(req)

    // enables secure system reading
    if(req.installationid == 'system') {
      req.installationid = settings.systeminstallation
      req.systemInstallation = true
    }  
  }
  else {
    opts.extractInstallation(req)
  }
  
  next()
}

module.exports = ParamMiddleware