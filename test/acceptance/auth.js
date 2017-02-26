"use strict";
const tape = require('tape')
const async = require('async')
const tools = require('./tools')

const headers = tools.headers

tape('auth - register', (t) => {
  const userData = tools.UserData()

  async.series({

    register: (next) => tools.register(userData, next),
    status: (next) => tools.status(next)

  }, (err, results) => {

    if(err) t.error(err)

    const register = results.register
    const status = results.status

    const EXPECTED_STATUS = {
      register: 201
    }

    const EXPECTED_BODY = {
      register: { registered: true },
      status: { loggedIn: true }
    }

    Object.keys(results).forEach((key) => {
      const result = results[key]
      const expectedStatus = EXPECTED_STATUS[key] || 200
      t.equal(result.statusCode, expectedStatus, key + ' = ' + expectedStatus + ' status')
    })

    Object.keys(EXPECTED_BODY).forEach((key) => {
      const result = results[key]
      const expected = EXPECTED_BODY[key]

      Object.keys(expected).forEach((field) => {
        t.equal(result.body[field], expected[field], key + ' - body - ' + field + ' = ' + expected[field])
      })
    })

    t.equal(register.body.data.email, userData.email, 'register email is correct')
    t.equal(status.body.data.email, userData.email, 'status email is correct')

    t.equal(register.body.data.hashed_password, undefined, 'no password deets')
    t.equal(status.body.data.hashed_password, undefined, 'no password deets')

    t.end()
  })
})


tape('auth - status', (t) => {
  const userData = tools.UserData()

  async.series({

    register: (next) => tools.register(userData, next),
    status: (next) => tools.status(next),
    logout: (next) => tools.logout(next),
    nostatus: (next) => tools.status(next),
    login: (next) => tools.login(userData, next),
    loginstatus: (next) => tools.status(next)

  }, (err, results) => {

    if(err) t.error(err)


    const register = results.register
    const status = results.status

    const EXPECTED_STATUS = {
      register: 201
    }

    const EXPECTED_BODY = {
      register: { registered: true },
      status: { loggedIn: true },
      nostatus: { loggedIn: false },
      login: { loggedIn: true },
      loginstatus: { loggedIn: true },
    }

    Object.keys(results).forEach((key) => {
      const result = results[key]
      const expectedStatus = EXPECTED_STATUS[key] || 200
      t.equal(result.statusCode, expectedStatus, key + ' = ' + expectedStatus + ' status')
    })

    Object.keys(EXPECTED_BODY).forEach((key) => {
      const result = results[key]
      const expected = EXPECTED_BODY[key]

      Object.keys(expected).forEach((field) => {
        t.equal(result.body[field], expected[field], key + ' - body - ' + field + ' = ' + expected[field])
      })
    })

    t.end()
  })
})


tape('auth - account exists', (t) => {
  const userData = tools.UserData()

  async.series({

    register: (next) => tools.register(userData, next),
    exists: (next) => tools.register(userData, next)

  }, (err, results) => {

    if(err) t.error(err)

    t.equal(results.exists.statusCode, 500, '500 status')
    t.equal(results.exists.body.error, userData.email + ' already exists', 'error message')

    t.end()
  })
})
