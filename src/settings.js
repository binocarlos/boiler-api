"use strict";
const args = require('minimist')(process.argv, {
  default:{
    port: process.env.PORT || 80,
    base: process.env.BASE || '/api/v1',
    domain: process.env.DOMAIN || 'localhost',
    emaildomain: process.env.EMAIL_DOMAIN || 'localhost',
    diggerhost: process.env.DIGGER_SERVICE_HOST || 'digger',
    diggerport: process.env.DIGGER_SERVICE_PORT || 80,
    postgreshost: process.env.POSTGRES_SERVICE_HOST || 'postgres',
    postgresport: process.env.POSTGRES_SERVICE_PORT || 5432,
    postgresuser: process.env.POSTGRES_SERVICE_USER,
    postgrespassword: process.env.POSTGRES_SERVICE_PASSWORD,
    postgresdatabase: process.env.POSTGRES_SERVICE_DATABASE,
    redishost: process.env.REDIS_SERVICE_HOST || 'redis',
    redisport: process.env.REDIS_SERVICE_PORT || 6379,
    redissessionprefix: process.env.REDIS_SESSION_PREFIX || 'session:',
    cookiesecret: process.env.COOKIE_SECRET || 'notsecure',
    systeminstallation: process.env.SYSTEM_INSTALLATION || '217'
  }
})

if(!args.postgresuser || !args.postgrespassword) {
  console.error('postgresuser and postgrespassword required')
  process.exit(1)
}

module.exports = args