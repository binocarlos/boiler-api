"use strict";
const tape = require('tape')
const async = require('async')
const tools = require('./tools')

const headers = tools.headers

tape('simple - simple', (t) => {
  const userData = tools.UserData()

  tools.register(userData, (err, results) => {

    if(err) t.error(err)

    console.log(JSON.stringify(results, null, 4))

    t.end()
  })
})
