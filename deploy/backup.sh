#!/bin/sh
# Daily backup of saved enquiries on the Hostinger VPS (docs/14_DEPLOY_HOSTINGER.md).
# Writes /root/weamaze-backups/enquiries-YYYY-MM-DD.tar.gz and keeps the last 30.
# Schedule it (as root):  crontab -e   then add:
#   15 2 * * * /opt/weamaze-visionary/deploy/backup.sh >> /var/log/weamaze-backup.log 2>&1
set -eu
DEST="${BACKUP_DIR:-/root/weamaze-backups}"
VOLUME="${BACKUP_VOLUME:-weamaze-visionary_weamaze_data}"
KEEP="${BACKUP_KEEP:-30}"
mkdir -p "$DEST"
chmod 700 "$DEST"
FILE="$DEST/enquiries-$(date -u +%Y-%m-%d).tar.gz"
docker run --rm -v "$VOLUME":/data:ro -v "$DEST":/backup alpine:3.22 \
  tar -czf "/backup/$(basename "$FILE")" -C /data .
chmod 600 "$FILE"
ls -1t "$DEST"/enquiries-*.tar.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f
echo "$(date -u +%FT%TZ) backup written: $FILE"
