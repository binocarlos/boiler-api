"use strict";
const IORedis = require('ioredis')

function Redis(settings) {
  const config = Object.assign({}, settings, {
    family: 4,
  })

  return new IORedis(config)
}


module.exports = Redis