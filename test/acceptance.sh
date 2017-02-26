#!/bin/bash -e
#
# scripts to manage the postgres database
#

set -e

export DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node ${DIR}/acceptance/simple.js
node ${DIR}/acceptance/basic.js
node ${DIR}/acceptance/auth.js
node ${DIR}/acceptance/clients.js
node ${DIR}/acceptance/installations.js
node ${DIR}/acceptance/resourceflat.js
node ${DIR}/acceptance/resourcetree.js
