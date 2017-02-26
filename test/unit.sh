#!/bin/bash -e
#
# scripts to manage the postgres database
#

set -e

export DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node ${DIR}/unit/database/crud.js
node ${DIR}/unit/database/sql.js
node ${DIR}/unit/models/installation.js
node ${DIR}/unit/models/user.js
node ${DIR}/unit/webserver/logger.js
