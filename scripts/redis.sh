#!/bin/bash -e

set -e

#
# scripts to manage the postgres database
export DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

function connect() {
  docker run -it --rm ${EXTRA_POSTGRES_DOCKER_ARGS} \
    --network quoteright_default \
    --link boiler_redis:redis \
    --entrypoint redis-cli \
    redis -h redis $@
}

function cli() {
  connect $@
}

function usage() {
cat <<EOF
Usage:
  cli                  run connected redis-cli
  help                 display this message
EOF
  exit 1
}

function main() {
  case "$1" in
  cli)             shift; cli $@;;
  help)            shift; usage $@;;
  *)               cli $@;;
  esac
}

main "$@"