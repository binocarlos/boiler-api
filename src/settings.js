"use strict";
const minimist = require('minimist')

const Settings = (overrides) => {
  const args = minimist(process.argv, {
    default:{
      port: process.env.PORT || 80,
      base: process.env.BASE || '/api/v1',
      mysqlhost: process.env.MYSQL_SERVICE_HOST || 'mysql',
      mysqlport: process.env.MYSQL_SERVICE_PORT || 3306,
      mysqluser: process.env.MYSQL_SERVICE_USER,
      mysqlpassword: process.env.MYSQL_SERVICE_PASSWORD,
      mysqldatabase: process.env.MYSQL_SERVICE_DATABASE,
      postgreshost: process.env.POSTGRES_SERVICE_HOST || 'postgres',
      postgresport: process.env.POSTGRES_SERVICE_PORT || 5432,
      postgresuser: process.env.POSTGRES_SERVICE_USER,
      postgrespassword: process.env.POSTGRES_SERVICE_PASSWORD,
      postgresdatabase: process.env.POSTGRES_SERVICE_DATABASE,
      redishost: process.env.REDIS_SERVICE_HOST || 'redis',
      redisport: process.env.REDIS_SERVICE_PORT || 6379,
      redissessionprefix: process.env.REDIS_SESSION_PREFIX || 'session:',
      cookiesecret: process.env.COOKIE_SECRET || 'notsecure'
    }
  })

  return Object.assign({}, args, overrides)
}

module.exports = Settings