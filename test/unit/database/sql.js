"use strict";
const tape = require('tape')
const tools = require('../testtools')
const SQL = require('../../../src/database/sql')

const BASE_TABLE = 'fruit'

const BASE_WHERE = {
  a: 'hello',
  b: 'apples'
}

const BASE_SQL = (baseIndex) => {
  baseIndex = baseIndex || 1
  return [
    `"a" = $${baseIndex}`,
    `and`,
    `"b" = $${baseIndex+1}`
  ].join("\n")
}

const BASE_PARAMS = Object.keys(BASE_WHERE).map(k => BASE_WHERE[k])

tape('sql - where', (t) => {
  const query = SQL.where(BASE_WHERE)
  t.deepEqual(query, {
    sql: BASE_SQL(),
    params: BASE_PARAMS
  }, 'the where clause is correct')
  t.end()
})

tape('sql - where, with offset', (t) => {
  const query = SQL.where(BASE_WHERE, {}, 2)
  t.deepEqual(query, {
    sql: BASE_SQL(2),
    params: BASE_PARAMS
  }, 'the where clause with offset is correct')
  t.end()
})

tape('sql - select', (t) => {
  const query = SQL.select(BASE_TABLE, BASE_WHERE)
  const CHECK_SELECT = [
    `select * from "${BASE_TABLE}"`,
    'where',
    BASE_SQL(),
    ''
  ].join("\n")

  t.deepEqual(query, {
    sql: CHECK_SELECT,
    params: BASE_PARAMS
  }, 'the select query is correct')
  t.end()
})

tape('sql - insert', (t) => {
  const query = SQL.insert(BASE_TABLE, BASE_WHERE)
  const CHECK_INSERT = tools.strip(`insert into "${BASE_TABLE}"
( "a", "b" ) values ( $1, $2 ) returning *`)
  t.deepEqual({
    sql: tools.strip(query.sql),
    params: query.params
  }, {
    sql: CHECK_INSERT,
    params: BASE_PARAMS
  }, 'the insert query is correct')
  t.end()
})

tape('sql - insert (raw value)', (t) => {
  const RAW_WHERE = Object.assign({}, BASE_WHERE, {
    rawval: 'lastval()'
  })
  const query = SQL.insert(BASE_TABLE, RAW_WHERE, {rawval: 'raw'})
  const CHECK_INSERT = tools.strip(`insert into "${BASE_TABLE}"
( "a", "b", "rawval" ) values ( $1, $2, lastval() ) returning *`)
  t.deepEqual({
    sql: tools.strip(query.sql),
    params: query.params
  }, {
    sql: CHECK_INSERT,
    params: BASE_PARAMS
  }, 'the insert + raw query is correct')
  t.end()
})

tape('sql - update', (t) => {
  const query = SQL.update(BASE_TABLE, {c: 'red'}, BASE_WHERE)
  const CHECK_UPDATE = [
    `update "${BASE_TABLE}" set`,
    `"c" = $1`,
    'where',
    BASE_SQL(2),
    'returning *',
    ''
  ].join("\n")
  t.deepEqual(query, {
    sql: CHECK_UPDATE,
    params: ['red'].concat(BASE_PARAMS)
  }, 'the update query is correct')
  t.end()
})

tape('sql - delete', (t) => {
  const query = SQL.delete(BASE_TABLE, BASE_WHERE)
  const CHECK_DELETE = [
    `delete from "${BASE_TABLE}"`,
    'where',
    BASE_SQL(),
    ''
  ].join("\n")
  t.deepEqual(query, {
    sql: CHECK_DELETE,
    params: BASE_PARAMS
  }, 'the delete query is correct')
  t.end()
})
