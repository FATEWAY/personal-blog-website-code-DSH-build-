#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/fateway-blog}"
KEEP_DAYS="${KEEP_DAYS:-30}"

cd "$APP_DIR"

# Consistent SQLite backup (handles WAL correctly).
npm run db:backup

# Media is not inside the database; archive it separately.
mkdir -p storage/backups
STAMP="$(date +%F-%H%M)"
tar -czf "storage/backups/uploads-${STAMP}.tar.gz" storage/uploads

# Keep 30 days of local backups. Copy them off-server regularly.
find storage/backups -maxdepth 1 -type f -mtime "+${KEEP_DAYS}" -delete

echo "Backup complete: storage/backups"
