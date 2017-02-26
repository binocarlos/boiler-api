#!/bin/bash -e
#
# scripts to manage the postgres database
#

set -e

export DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

POSTGRES_HOST="postgres"
POSTGRES_USER="boilerapi"
POSTGRES_PASSWORD="boilerapi"
POSTGRES_DATABASE="boilerapi"
TEMP_FILE="${DIR}/../.data/boiler_command.sql"

function connect() {
  docker run -i --rm ${EXTRA_DOCKER_ARGS} \
    --network boilerapi_default \
    --link boilerapi_postgres:postgres \
    -e PGPASSWORD=${POSTGRES_PASSWORD} \
    postgres $@
}

function psql() {
  local cmd="psql --host ${POSTGRES_HOST} --username ${POSTGRES_USER} --dbname ${POSTGRES_DATABASE} $@"
  if [ -t 0 ]; then
    echo 'connecting to postgres'
    export EXTRA_DOCKER_ARGS="${EXTRA_DOCKER_ARGS} -t "
  fi
  connect ${cmd}
}

function psqlfile() {
  local file="${1}"
  local cmd=""
  if [ -t 0 ]; then
    echo "loading sql file ${file}"
  else
    cat > ${TEMP_FILE}
    file="${TEMP_FILE}"
  fi
  if [ -f "${file}" ]; then
    export EXTRA_DOCKER_ARGS="${EXTRA_DOCKER_ARGS} -v ${file}:/tmp/command.sql "
    cmd="${cmd} --file /tmp/command.sql"
  fi
  psql ${cmd}
}

function usage() {
cat <<EOF
Usage:
  psql                 run connected psql
  psqlfile             pipe stdin or $1 = filepath
  help                 display this message
EOF
  exit 1
}

function main() {
  case "$1" in
  psql)            shift; psql $@;;
  psqlfile)        shift; psqlfile $@;;
  help)            shift; usage $@;;
  *)               psql $@;;
  esac
}

main "$@"