"use strict";

const ACCESS_LEVELS = {
  write: 20,
  read: 10,
  none: 0
}

const ACCESS_NAMES = {
  owner: 'write',
  editor: 'write',
  viewer: 'read'
}

const DEFAULT_ACCESS_LEVEL = 'viewer'

const getAccessLevel = (level) => ACCESS_LEVELS[ACCESS_NAMES[level] || 'none']

const canAccess = (required, actual) => {
  required = required || DEFAULT_ACCESS_LEVEL
  if(!actual) return false
  return getAccessLevel(actual) >= getAccessLevel(required)
}

module.exports = canAccess