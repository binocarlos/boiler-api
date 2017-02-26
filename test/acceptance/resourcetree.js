"use strict";
const tape = require('tape')
const async = require('async')
const tools = require('./tools')
const FIXTURES = require('./fixtures.json')
const NODE = FIXTURES.resourceNode
const TREE = FIXTURES.resourceTree
const TREE2 = FIXTURES.resourceTree2
const MATERIALS = FIXTURES.materialsFolder
const headers = tools.headers

const register = (userData, done) => {
  if(!done) {
    done = userData
    userData = tools.UserData() 
  }
  let user = null

  async.series({
    user: (next) => tools.register(userData, next)
  }, (err, results) => {
    if(err) t.error(err)

    const user = results.user.body.data
    const installationid = user.meta.activeInstallation 
    
    done(null, {
      user,
      installationid
    })

  })
}

const createResourceTree = (tree, userData, done) => {
  register(userData, (err, base) => {
    if(err) t.error(err)
    tools.createResource(base.installationid, tree, (err, results) => {
      if(err) return done(err)
      done(null, Object.assign({}, base, {
        folder: results
      }))
    })
  })
}

const createResourceSubTree = (tree, userData, done) => {
  createResourceTree(tree, userData, (err, base) => {

    const topfolder = base.folder.body
    const middlefolder = topfolder.children[0]
    const lowerfolder = middlefolder.children[0]

    tools.appendResource(base.installationid, lowerfolder.id, tree, (err, results) => {
      if(err) return done(err)
      done(null, {
        installationid: base.installationid,
        results,
        topfolder,
        middlefolder,
        lowerfolder
      })
    })
  })
}

const createMaterials = (materials, userData, done) => {

  register(userData, (err, base) => {
    if(err) t.error(err)
    tools.createResource(base.installationid, materials, (err, results) => {
      if(err) return done(err)
      done(null, Object.assign({}, base, {
        folder: results
      }))
    })
  })

}

tape('resourcetree - create resource tree', (t) => {
  const userData = tools.UserData()

  createResourceTree(TREE, userData, (err, base) => {

    const topfolder = base.folder.body
    const middlefolder = topfolder.children[0]
    const lowerfolder = middlefolder.children[0]

    t.equal(topfolder.type, 'folder', 'top is folder')
    t.equal(middlefolder.type, 'folder', 'top is folder')
    t.equal(lowerfolder.type, 'folder', 'top is folder')

    t.equal(topfolder.parent, null, 'top has no parent')
    t.equal(middlefolder.parent, topfolder.id, 'top is middle parent')
    t.equal(lowerfolder.parent, middlefolder.id, 'middle is lower parent')

    t.equal(topfolder.path, 'root', 'top has root path')
    t.equal(middlefolder.path, topfolder.path + '.' + topfolder.id, 'middle path')
    t.equal(lowerfolder.path, middlefolder.path + '.' + middlefolder.id, 'lowerpath')

    t.equal(topfolder.meta.price, 10, 'top price is correct')

    t.end()
  })
})

tape('resourcetree - delete resource tree', (t) => {
  const userData = tools.UserData()

  createResourceTree(TREE, userData, (err, base) => {

    const topfolder = base.folder.body
    const middlefolder = topfolder.children[0]
    const lowerfolder = middlefolder.children[0]

    async.series({
      delete: (next) => tools.deleteResource(base.installationid, middlefolder.id, next),
      list: (next) => tools.listResources(base.installationid, {}, next)
    }, (err, results) => {
      if(err) t.error(err)

      t.equal(results.delete.statusCode, 200, 'delete 200 code')
      t.equal(results.list.statusCode, 200, 'list 200 code')
      t.equal(results.list.body.length, 1, 'only 1 resource left')
      t.equal(results.list.body[0].id, topfolder.id, 'only topfolder resource left')
      
      t.end()
    })

  })
})

tape('resourcetree - get children', (t) => {
  const userData = tools.UserData()

  createResourceTree(TREE, userData, (err, base) => {

    const topfolder = base.folder.body
    const middlefolder = topfolder.children[0]
    const lowerfolder = middlefolder.children[0]

    async.series({
      root: (next) => tools.resourceChildren(base.installationid, null, {}, next), 
      top: (next) => tools.resourceChildren(base.installationid, topfolder.id, {}, next),
      middle: (next) => tools.resourceChildren(base.installationid, middlefolder.id, {}, next),
      lower: (next) => tools.resourceChildren(base.installationid, lowerfolder.id, {}, next)
    }, (err, results) => {
      if(err) t.error(err)

      const children = {
        root: results.root.body[0],
        top: results.top.body[0],
        middle: results.middle.body[0],
        lower: results.lower.body[0]
      }

      t.equal(children.root.id, topfolder.id, 'root -> top')
      t.equal(children.top.id, middlefolder.id, 'top -> middle')
      t.equal(children.middle.id, lowerfolder.id, 'middle -> lower')
      t.equal(results.lower.body.length, 0, 'no children for lower')

      t.end()
    })

  })
})


tape('resourcetree - append sub-tree', (t) => {
  const userData = tools.UserData()

  createResourceSubTree(TREE, userData, (err, base) => {
    const subtopfolder = base.results.body
    t.equal(subtopfolder.parent, base.lowerfolder.id, 'sub-folder has lower as parent')
    t.end()
  })
})

tape('resourcetree - get descendents', (t) => {
  const userData = tools.UserData()

  createResourceSubTree(TREE, userData, (err, base) => {
    const middlefolder = base.middlefolder

    tools.resourceDescendents(base.installationid, middlefolder.id, {}, (err, results) => {

      const titles = results.body.map(item => item.name)

      t.deepEqual(titles, [
        'lower folder',
        'lower folder',
        'middle folder',
        'top folder'
      ])

      t.end()
    })

  })
})

tape('resourcetree - get children with search and type', (t) => {
  const userData = tools.UserData()

  createResourceSubTree(TREE2, userData, (err, base) => {
    const middlefolder = base.middlefolder

    async.parallel({
      searchMatch: (next) => {
        tools.resourceChildren(base.installationid, middlefolder.id, {
          search: 'lower'
        }, next)
      },
      searchNomatch: (next) => {
        tools.resourceChildren(base.installationid, middlefolder.id, {
          search: 'lower2'
        }, next)
      },
      typeMatch: (next) => {
        tools.resourceChildren(base.installationid, middlefolder.id, {
          type: 'folder'
        }, next)
      },
      typeNomatch: (next) => {
        tools.resourceChildren(base.installationid, middlefolder.id, {
          type: 'folder2'
        }, next)
      },
      bothMatch: (next) => {
        tools.resourceChildren(base.installationid, middlefolder.id, {
          search: 'lower',
          type: 'folder'
        }, next)
      },
      bothNoMatch: (next) => {
        tools.resourceChildren(base.installationid, middlefolder.id, {
          search: 'lower2',
          type: 'folder2'
        }, next)
      }
    }, (err, results) => {

      t.equal(results.searchMatch.body.length, 1, 'search match')
      t.equal(results.searchNomatch.body.length, 0, 'search nomatch')
      t.equal(results.typeMatch.body.length, 1, 'type match')
      t.equal(results.typeNomatch.body.length, 0, 'type nomatch')
      t.equal(results.bothMatch.body.length, 1, 'both match')
      t.equal(results.bothNoMatch.body.length, 0, 'both nomatch')

      t.end()
    })

  })
})

tape('resourcetree - get list with search and type', (t) => {
  const userData = tools.UserData()

  createResourceSubTree(TREE2, userData, (err, base) => {
    const middlefolder = base.middlefolder

    async.parallel({
      searchMatch: (next) => {
        tools.listResources(base.installationid, {
          search: 'lower'
        }, next)
      },
      searchNomatch: (next) => {
        tools.listResources(base.installationid, {
          search: 'lower2'
        }, next)
      },
      typeMatch: (next) => {
        tools.listResources(base.installationid, {
          type: 'folder'
        }, next)
      },
      typeNomatch: (next) => {
        tools.listResources(base.installationid, {
          type: 'folder2'
        }, next)
      },
      bothMatch: (next) => {
        tools.listResources(base.installationid, {
          search: 'lower',
          type: 'folder'
        }, next)
      },
      bothNomatch: (next) => {
        tools.listResources(base.installationid, {
          search: 'lower2',
          type: 'folder2'
        }, next)
      }
    }, (err, results) => {

      t.equal(results.searchMatch.body.length, 2, 'search match')
      t.equal(results.searchNomatch.body.length, 0, 'search nomatch')
      t.equal(results.typeMatch.body.length, 6, 'type match')
      t.equal(results.typeNomatch.body.length, 0, 'type nomatch')
      t.equal(results.bothMatch.body.length, 2, 'both match')
      t.equal(results.bothNomatch.body.length, 0, 'both nomatch')

      t.end()
    })

  })
})

tape('resourcetree - get descendents with search and type', (t) => {
  const userData = tools.UserData()

  createResourceSubTree(TREE2, userData, (err, base) => {
    const topfolder = base.topfolder

    async.parallel({
      searchMatch: (next) => {
        tools.resourceDescendents(base.installationid, topfolder.id, {
          search: 'lower'
        }, next)
      },
      searchNomatch: (next) => {
        tools.resourceDescendents(base.installationid, topfolder.id, {
          search: 'lower2'
        }, next)
      },
      typeMatch: (next) => {
        tools.resourceDescendents(base.installationid, topfolder.id, {
          type: 'folder'
        }, next)
      },
      typeNomatch: (next) => {
        tools.resourceDescendents(base.installationid, topfolder.id, {
          type: 'folder2'
        }, next)
      },
      bothMatch: (next) => {
        tools.resourceDescendents(base.installationid, topfolder.id, {
          search: 'lower',
          type: 'folder'
        }, next)
      },
      bothNomatch: (next) => {
        tools.resourceDescendents(base.installationid, topfolder.id, {
          search: 'lower2',
          type: 'folder2'
        }, next)
      }
    }, (err, results) => {

      t.equal(results.searchMatch.body.length, 2, 'search match')
      t.equal(results.searchNomatch.body.length, 0, 'search nomatch')
      t.equal(results.typeMatch.body.length, 5, 'type match')
      t.equal(results.typeNomatch.body.length, 0, 'type nomatch')
      t.equal(results.bothMatch.body.length, 2, 'both match')
      t.equal(results.bothNomatch.body.length, 0, 'both nomatch')

      t.end()
    })

  })
})


tape('resourcetree - get descendents with search', (t) => {
  const userData = tools.UserData()

  createResourceSubTree(TREE2, userData, (err, base) => {
    const middlefolder = base.middlefolder

    tools.resourceDescendents(base.installationid, middlefolder.id, {
      search: 'lower'
    }, (err, results) => {

      const titles = results.body.map(item => item.name)

      t.deepEqual(titles, [
        'lower',
        'lower'
      ])

      t.end()
    })

  })
})

tape('resourcetree - get root descendents with search', (t) => {
  const userData = tools.UserData()

  createResourceSubTree(TREE2, userData, (err, base) => {
    const middlefolder = base.middlefolder

    tools.resourceDescendents(base.installationid, null, {
      search: 'lower'
    }, (err, results) => {

      const titles = results.body.map(item => item.name)

      t.deepEqual(titles, [
        'lower',
        'lower'
      ])

      t.end()
    })

  })
})

tape('resourcetree - copy paste', (t) => {
  const userData = tools.UserData()
  const EXTRA_FOLDER = {
    "name": "extra folder",
    "type": "folder",
    "meta": {}
  }
  const PASTE_TO_FOLDER = {
    "name": "paste to folder",
    "type": "folder",
    "meta": {}
  }
  let base = null

  async.waterfall([
    (next) => createResourceSubTree(TREE, userData, next),

    // we want to copy paste 2 things so add another into the top folder
    // we copy EXTRA and MIDDLE into PASTE_TO
    (b, next) => {
      base = b
      const topfolder = base.topfolder
      tools.appendResource(base.installationid, topfolder.id, EXTRA_FOLDER, next)
    },

    // ADD the PASTE_TO folder to the top
    (results, next) => {
      base.extrafolder = results.body
      const topfolder = base.topfolder
      tools.createResource(base.installationid, PASTE_TO_FOLDER, next)
    },

    (results, next) => {
      base.pasteToFolder = results.body

      const extrafolder = base.extrafolder
      const middlefolder = base.middlefolder
      const pasteToFolder = base.pasteToFolder

      tools.copyResources(base.installationid, pasteToFolder.id, [extrafolder.id, middlefolder.id], next)
    }
  ], (err, results) => {
    if(err) t.error(err)

    const originalItems = results.body.originalItems
    const targetItems = results.body.targetItems


    t.ok(originalItems[0].id != targetItems[0].id, 'extra folder ids are different')
    t.equal(originalItems[0].name, targetItems[0].name, 'extra folder names are same')
    
    t.end()
  })
})

tape('resourcetree - copy paste with bad params', (t) => {
  const userData = tools.UserData()
  const EXTRA_FOLDER = {
    "name": "extra folder",
    "type": "folder",
    "meta": {}
  }
  const PASTE_TO_FOLDER = {
    "name": "paste to folder",
    "type": "folder",
    "meta": {}
  }
  let base = null

  async.waterfall([
    (next) => createResourceSubTree(TREE, userData, next),

    // we want to copy paste 2 things so add another into the top folder
    // we copy EXTRA and MIDDLE into PASTE_TO
    (b, next) => {
      base = b
      const topfolder = base.topfolder
      tools.appendResource(base.installationid, topfolder.id, EXTRA_FOLDER, next)
    },

    // ADD the PASTE_TO folder to the top
    (results, next) => {
      base.extrafolder = results.body
      const topfolder = base.topfolder
      tools.createResource(base.installationid, PASTE_TO_FOLDER, next)
    },

    (results, next) => {
      base.pasteToFolder = results.body

      const extrafolder = base.extrafolder
      const middlefolder = base.middlefolder
      const pasteToFolder = base.pasteToFolder

      tools.badCopyResources(base.installationid, pasteToFolder.id, [extrafolder.id, middlefolder.id], next)
    }
  ], (err, results) => {
    if(err) t.error(err)

    t.equal(results.statusCode, 500, '500 code')
    t.equal(results.body.error, 'no copy or cut ids passed')
    
    t.end()
  })
})


tape('resourcetree - create linked resource', (t) => {
  const userData = tools.UserData()

  createMaterials(MATERIALS, userData, (err, base) => {

    const data = Object.assign({}, NODE, {
      name: 'Test Template',
      type: 'template',
      meta: {},
      links: base.folder.body.children.map(c => {
        return {
          id: c.id,
          meta: {}
        }
      })
    })

    tools.createResource(base.installationid, data, (err, results) => {
      if(err) t.error(err)

      t.equal(results.body.links.length, 2, '2 links present')
      
      t.end()
    })

  })
})


// create resource-links 3 layers deep and check a single
// request to /resources/links/:id?follow=y resolves all layers
tape('resourcetree - get double resource links', (t) => {
  const userData = tools.UserData()

  const MATERIALS2 = JSON.parse(JSON.stringify(MATERIALS))
  const MATERIALS3 = JSON.parse(JSON.stringify(MATERIALS))

  MATERIALS2.children = MATERIALS2.children.map(c => Object.assign({}, c, {
    name: c.name + '2'
  }))

  MATERIALS3.children = MATERIALS3.children.map(c => Object.assign({}, c, {
    name: c.name + '3'
  }))

  const allResults = {}

  register(userData, (err, base) => {
    if(err) t.error(err)

    async.waterfall([
      (next) => {
        tools.createResource(base.installationid, MATERIALS, (err, results) => {
          if(err) return next(err)

          const data = Object.assign({}, NODE, {
            name: 'Test Template 1',
            type: 'template',
            meta: {},
            links: results.body.children.map(c => {
              return {
                id: c.id,
                meta: {}
              }
            })
          })

          tools.createResource(base.installationid, data, next)
        })
      },

      (template1, next) => {
        allResults.template1 = template1
        tools.createResource(base.installationid, MATERIALS2, (err, results) => {
          if(err) return next(err)

          const data = Object.assign({}, NODE, {
            name: 'Test Template 2',
            type: 'template',
            meta: {},
            links: results.body.children.map(c => {
              return {
                id: c.id,
                meta: {}
              }
            }).concat([{
              id: template1.body.id,
              meta: {}
            }])
          })

          tools.createResource(base.installationid, data, next)
        })
      },

      (template2, next) => {
        allResults.template2 = template2
        tools.createResource(base.installationid, MATERIALS3, (err, results) => {
          if(err) return next(err)

          const data = Object.assign({}, NODE, {
            name: 'Test Template 3',
            type: 'template',
            meta: {},
            links: results.body.children.map(c => {
              return {
                id: c.id,
                meta: {}
              }
            }).concat([{
              id: template2.body.id,
              meta: {}
            }])
          })

          tools.createResource(base.installationid, data, next)
        })
      },

      (template3, next) => {
        allResults.template3 = template3
        async.series({
          flat: (n) => tools.getResourceLinks(base.installationid, template3.body.id, {}, n),
          tree: (n) => tools.getResourceLinks(base.installationid, template3.body.id, {follow:'y'}, n)
        }, next)
      }
    ], (err, links) => {
      if(err) t.error(err)

      const template1LinkChildIds = allResults.template1.body.links.map(l => l.child)
      const template2LinkChildIds = allResults.template2.body.links.map(l => l.child)
      const template3LinkChildIds = allResults.template3.body.links.map(l => l.child)

      const template1LinkParentIds = allResults.template1.body.links.map(l => l.parent)
      const template2LinkParentIds = allResults.template2.body.links.map(l => l.parent)
      const template3LinkParentIds = allResults.template3.body.links.map(l => l.parent)

      const flatResourceIds = links.flat.body.map(i => i.id)


      // the list of flat links is correct
      t.deepEqual(flatResourceIds, template3LinkChildIds, 'flat id list is correct')
      t.equal(links.tree.body.length, 3, '3 links in tree root')
      t.equal(links.tree.body[2].links.length, 3, '3 links in tree layer 2')
      t.equal(links.tree.body[2].links[2].resource.links.length, 2, '2 links in tree layer 3')

      t.end()
    })
  })
})



tape('resourcetree - get links with meta', (t) => {
  const userData = tools.UserData()

  createMaterials(MATERIALS, userData, (err, base) => {

    const data = Object.assign({}, NODE, {
      name: 'Test Template',
      type: 'template',
      meta: {},
      links: base.folder.body.children.map(c => {
        return {
          id: c.id,
          meta: {
            fruit: 'apples'
          }
        }
      })
    })

    tools.createResource(base.installationid, data, (err, results) => {
      if(err) t.error(err)

      tools.getResourceLinks(base.installationid, results.body.id, {}, (err, links) => {

        t.equal(links.body[0].meta.fruit, 'apples', 'the links have meta')
        
        t.end()
      })

    })

  })
})


tape('resourcetree - get resource with links', (t) => {
  const userData = tools.UserData()

  createMaterials(MATERIALS, userData, (err, base) => {

    const data = Object.assign({}, NODE, {
      name: 'Test Template',
      type: 'template',
      meta: {},
      links: base.folder.body.children.map(c => {
        return {
          id: c.id,
          meta: {
            fruit: 'apples'
          }
        }
      })
    })

    tools.createResource(base.installationid, data, (err, results) => {
      if(err) t.error(err)

      tools.getResource(base.installationid, results.body.id, {links:'y'}, (err, resource) => {

        
        t.equal(resource.body.links[0].meta.fruit, 'apples', 'the links have meta')
        
        t.end()
      })

    })

  })
})

tape('resourcetree - get children with links', (t) => {
  const userData = tools.UserData()

  createMaterials(MATERIALS, userData, (err, base) => {

    const data = Object.assign({}, NODE, {
      name: 'Test Template',
      type: 'template',
      meta: {},
      links: base.folder.body.children.map(c => {
        return {
          id: c.id,
          meta: {
            fruit: 'apples'
          }
        }
      })
    })

    tools.createResource(base.installationid, data, (err, results) => {
      if(err) t.error(err)

      tools.resourceChildren(base.installationid, null, {links:'y',type:'template'}, (err, results) => {

        
        t.ok(results.body[0].links.length > 0, 'there are some links')
        
        t.end()
      })

    })

  })
})

tape('resourcetree - copy paste whole tree', (t) => {
  const userData = tools.UserData()
  const PASTE_TO_FOLDER = {
    "name": "paste to folder",
    "type": "folder",
    "meta": {}
  }
  let base = null

  async.waterfall([
    (next) => createResourceTree(TREE, userData, next),

    (b, next) => {
      base = {
        folder: b.folder.body,
        user: b.user,
        installationid: b.installationid
      }
      tools.createResource(base.installationid, PASTE_TO_FOLDER, next)
    },

    (results, next) => {
      base.pasteToFolder = results.body
      tools.copyResources(base.installationid, base.pasteToFolder.id, [base.folder.id], next)
    },

    (results, next) => {

      async.series({
        copied: n => tools.resourceDescendents(base.installationid, base.folder.id, {}, n),
        pasted: n => tools.resourceDescendents(base.installationid, base.pasteToFolder.id, {}, n)
      }, next)
      
    },
  ], (err, results) => {
    if(err) t.error(err)

    t.equal(results.pasted.body.length, 3, 'all 3 pasted items')
    t.end()
    
  })
})
