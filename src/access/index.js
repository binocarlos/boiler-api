"use strict";

const AccessControl = require('./control')

const factory = (settings, controllers, UserAccess) => {
  const systemAccess = AccessControl(settings, controllers, {
    getInstallationAccess: (id) => {
      return id == settings.systeminstallation ?
        'viewer' :
        null
    }
  })

  const userAccess = UserAccess ?
    UserAccess(settings, controllers, systemAccess) :
    {}

  return Object.assign({}, systemAccess, userAccess)
}

module.exports = factory