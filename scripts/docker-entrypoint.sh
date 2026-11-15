#!/bin/sh
# Container start-up for WeAmaze Visionary.
#
# Fly.io mounts the persistent volume (enquiries and their outbox) owned by root. The app
# itself never runs as root: this script, which starts as root, hands the data folder to
# the unprivileged "node" user, then replaces itself with the server running as that user.
# Started without root (a plain `docker run --user node`), it simply runs the server.
set -eu

DATA_DIR="${LEAD_STORE_DIR:-/data}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  # Only on first use (a new, root-owned volume). Afterwards the folder already belongs to
  # "node", and root may not even be able to read it when the container runs with reduced
  # privileges (docker-compose.yml), so it is left as it is.
  if [ "$(stat -c %u "$DATA_DIR")" != "$(id -u node)" ]; then
    chown -R node:node "$DATA_DIR"
  fi
  chmod 0700 "$DATA_DIR"
  exec setpriv --reuid=node --regid=node --init-groups --inh-caps=-all --no-new-privs -- "$@"
fi

exec "$@"
