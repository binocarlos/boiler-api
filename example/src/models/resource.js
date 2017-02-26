"use strict";
const async = require('async')
const SQL = require('boiler-api/src/database/sql')
const selectors = require('boiler-api/src/database/selectors')

// https://www.postgresql.org/docs/9.3/static/ltree.html

// fields we never update using standard crud methods
const STRIP_CREATE_FIELDS = {
  'children': true,
  'links': true
}

const STRIP_SAVE_FIELDS = Object.assign({}, STRIP_CREATE_FIELDS, {
  'installation': true
})

const Search = (params, string) => {
  if(!string) {
    return {
      sql: '',
      params
    }
  }
  const index = params.length + 1

  const sql = `and
      lower(name) like lower($${index})
`

  return {
    sql,
    params: params.concat(['%' + string + '%'])
  }
}

const Type = (params, string) => {
  if(!string) {
    return {
      sql: '',
      params
    }
  }
  const index = params.length + 1

  const sql = `and
      type = $${index}
`

  return {
    sql,
    params: params.concat([string])
  }
}

const QUERIES = {

  list: (p) => {

    const params = [p.installationid]
    const search = Search(params, p.search)
    const type = Type(search.params, p.type)

    const sql = `select *
from
  resource
where
(
  installation = $1
  ${search.sql}
  ${type.sql}
)
order by
  name
`

    const ret = {
      sql,
      params: type.params
    }

    return ret
  },

  // links from multiple ids
  // NOTE - this deals with only resource_link.type = 'resource'
  links: (p) => {

    const ids = p.ids || []

    const clause = ids.map((id, i) => {
      return `resource_link.parent = $${i+1}`
    }).join(`
or
`)

    const insertClause = clause ?
      `and ( ${clause} )` :
      ''
  
    const sql = `select
  resource.*,
  resource_link.parent as link_parent,
  resource_link.meta as link_meta
from
  resource
join
  resource_link
on
(
  resource_link.child = resource.id
  and
  resource_link.type = 'resource'
  ${insertClause}
)
order by
  name
`

    const ret = {
      sql,
      params: ids
    }

    return ret
  },

  children: (p) => {

    const params = p.id ?
      [p.installationid, p.id] :
      [p.installationid]

    const idClause = p.id ?
      '= $2'
      : 'is null'

    const search = Search(params, p.search)
    const type = Type(search.params, p.type)

    const sql = `select *
from
  resource
where
(
  installation = $1
  and
  parent ${idClause}
  ${search.sql}
  ${type.sql}
)
order by
  name
`

    const ret = {
      sql,
      params: type.params
    }

    return ret
  },

  descendents: (p) => {
    if(!p.id) return QUERIES.list(p)

    const search = Search([p.id, p.installationid], p.search)
    const type = Type(search.params, p.type)

    const sql = `select *
from
  resource
where
  path <@ (
    select
      path::text || '.' || id::text as path
    from
      resource
    where
      id = $1
  )::ltree
  and
  installation = $2
  ${search.sql}
  ${type.sql}
order by
  name
`

    const ret = {
      sql,
      params: type.params
    }

    return ret
  },

  update: (params, data) => {
    return SQL.update('resource', stripResource(data), params)
  },
  delete: (params) => SQL.delete('resource', params),
}

const stripResource = (data, fields) => {
  fields = fields || STRIP_SAVE_FIELDS
  return Object.keys(data || {})
    .filter(k => fields[k] ? false : true)
    .reduce((all, k) => {
      all[k] = data[k]
      return all
    }, {})
}

const prepareData = (resource, installation) => {
  const meta = resource.meta || {}
  return Object.assign({}, resource, {
    installation,
    meta: typeof(meta) == 'string' ?
      meta :
      JSON.stringify(meta)
  })
}

const prepareResource = (resource, installation) => {
  const obj = Object.assign({}, resource)
  const children = obj.children || []
  const links = obj.links || []
  delete(obj.children)
  delete(obj.links)
  return {
    data: prepareData(obj, installation),
    children,
    links
  }
}

const assignChildToParent = (parent, child) => {
  let inject = {}
    
  if(parent.id) {
    inject.parent = parent.id
    inject.path = [
      parent.path,
      parent.id
    ].join('.')
  }
  else {
    inject.path = parent.path
  }

  return Object.assign({}, child, inject)
}

const stripTreeFields = (item, removeId) => {
  let ret = Object.assign({}, item)
  delete(ret.parent)
  delete(ret.path)
  delete(ret.installation)
  if(removeId) {
    delete(ret.id)
  }
  ret.children = (ret.children || []).map(item => stripTreeFields(item, removeId))
  return ret
}

const getRootParent = (installation) => {
  return {
    installation,
    path: 'root'
  }
}



//   * params
//     * id
//     * links
const get = (runQuery, query, done) => {
  const params = query.params || {}
  runQuery(SQL.select('resource', {id:query.params.id}), selectors.single(((err, resource) => {
    if(err) return done(err)
    if(!resource) return done()
    if((params.links || '').toLowerCase().indexOf('y') == 0) {
      linkTree(runQuery, {
        params: query.params
      }, (err, links) => {
        if(err) return done(err)
        resource.links = (links || []).map(mapLink)
        done(null, resource)
      })
    }
    else {
      done(null, resource)
    }
  })))
}

//   * params
//     * installationid
const list = (runQuery, query, done) => runQuery(QUERIES.list(query.params), selectors.rows(done))

//   * params
//     * id
//     * installationid
//     * search
//     * type
const children = (runQuery, query, done) => {
  const params = query.params || {}

  runQuery(QUERIES.children(params), selectors.rows((err, items) => {
    if(err) return done(err)
    if(!items) return done()
    if((params.links || '').toLowerCase().indexOf('y') == 0) {
      linkTree(runQuery, {
        params: {
          installationid: query.params.installationid,
          ids: items.map(item => item.id)
        }
      }, (err, links) => {
        if(err) return done(err)

        const parentMap = items.reduce((all, item) => {
          return Object.assign({}, all, {
            [item.id]: item
          })
        }, {})

        links.forEach(link => {
          const parent = parentMap[link.link_parent]
          if(!parent) return
          parent.links = parent.links || []
          parent.links.push(mapLink(link))
        })

        done(null, items)
      })
    }
    else {
      done(null, items)
    }
  }))
}

//   * params
//     * id
//     * installationid
const descendents = (runQuery, query, done) => runQuery(QUERIES.descendents(query.params), selectors.rows(done))

// turn the descendent list into a tree structure where each node has a 'children' property
const tree = (runQuery, query, done) => {
  descendents(runQuery, query, (err, results) => {
    if(err) return done(err)

    let rootItems = []
    const idMap = results.reduce((all, item) => Object.assign({}, all, {[item.id]:item}), {})

    results.forEach(item => {
      const parent = idMap[item.parent]
      if(parent) {
        parent.children = parent.children || []
        parent.children.push(item)
      }
      else {
        rootItems.push(item)
      }
    })
    done(null, rootItems)
  })
}

const mapLink = (link) => {
  return {
    id: link.id,
    meta: link.link_meta,
    resource: link
  }
}
const linkTreeLayer = (runQuery, installationid, parents, done) => {
  const parentMap = parents.reduce((all, item) => {
    all[item.id] = item
    return all
  }, {})

  runQuery(QUERIES.links({
    installationid,
    ids: parents.map(p => p.id)
  }), selectors.rows((err, linkResources) => {
    if(err) return done(err)
    linkResources.forEach(link => {
      const parent = parentMap[link.link_parent]
      parent.links = parent.links || []
      parent.links.push(mapLink(link))
    })

    // there is no more resolving to do
    if(linkResources.length<=0) {
      return done(null, parents)
    }

    linkTreeLayer(runQuery, installationid, linkResources, (err) => {
      if(err) return done(err)
      done(null, parents)
    })
  }))
}

// deep resolve all links
const linkTree = (runQuery, query, done) => {
  runQuery(QUERIES.links({
    installationid: query.params.installationid,
    ids: query.params.ids || [query.params.id]
  }), selectors.rows((err, links) => {
    if(err) return done(err)
    if(links.length <= 0) return done(null, links)
    linkTreeLayer(runQuery, query.params.installationid, links, done)
  }))
}

const linkChildren = (runQuery, query, done) => {
  runQuery(QUERIES.links({
    installationid: query.params.installationid,
    ids: [query.params.id]
  }), selectors.rows((err, links) => {
    if(err) return done(err)
    done(null, links.map(mapLink))
  }))
}

// get the links for a single resource

// the ?follow=yes means return an entire tree (ready for quote insertion)
const links = (runQuery, query, done) => {

  const params = query.params

  const handler = (params.follow || '').toLowerCase().indexOf('y') == 0 ?
    linkTree :
    linkChildren

  handler(runQuery, query, done)
}

const createLinks = (runQuery, parentid, links, done) => {
  async.parallel(links.map(link => next => {
    runQuery(SQL.insert('resource_link', {
      parent: parentid,
      child: link.id,
      meta: link.meta || {},
      type: 'resource'
    }), selectors.single(next))
  }), done)
}

const deleteLinks = (runQuery, parentid, done) => {
  runQuery(SQL.delete('resource_link', {
    parent: parentid
  }), done)
}

// create resource with children
const createChildren = (runQuery, parent, query, done) => {

  const resource = prepareResource(assignChildToParent(parent, query.data), query.params.installationid)

  runQuery(SQL.insert('resource', stripResource(resource.data, STRIP_CREATE_FIELDS)), selectors.single((err, childResult) => {
    if(err) return done(err)

    const childCreators = (resource.children || []).map(child => next => {
      createChildren(runQuery, childResult, {
        params: query.params,
        data: child
      }, next)
    })

    const links = resource.links || []

    async.parallel({
      children: (next) => async.parallel(childCreators, next),
      links: (next) => createLinks(runQuery, childResult.id, links, next)
    }, (err, results) => {
      if(err) return done(err)
      done(null, Object.assign({}, childResult, {
        children: results.children,
        links: results.links
      }))
    })
  }))
}

//   * params
//     * parentid
//     * installationid
//   * data
//     * name
//     * type
//     * labels[][]
//     * meta
//     * children[resource]
const create = (runQuery, query, done) => {

  async.waterfall([

    // first get the parent (if any) so we can assign the first level
    (next) => {
      if(!query.params.parentid) {
        const parent = getRootParent(query.params.installationid)
        next(null, parent)
      }
      else {
        runQuery(SQL.select('resource', {
          id: query.params.parentid
        }), selectors.single(next))
      }
    },

    (parent, next) => {
      createChildren(runQuery, parent, query, next)
    }
  ], done)

}

const save = (runQuery, query, done) => {

  const resource = prepareResource(query.data, query.params.installationid)

  async.series([

    // delete links
    (next) => {
      deleteLinks(runQuery, resource.data.id, next)
    },

    // re-insert links
    (next) => {
      createLinks(runQuery, resource.data.id, resource.links || [], next)
    }

  ], (err) => {
    if(err) return done(err)
    runQuery(QUERIES.update(query.params, resource.data), selectors.single(done))    
  })
}

const del = (runQuery, query, done) => runQuery(QUERIES.delete(query.params), selectors.single(done))

module.exports = {
  QUERIES,
  get: get,
  list,
  children,
  descendents,
  links,
  tree,
  stripTreeFields,
  create,
  save,
  delete: del
}