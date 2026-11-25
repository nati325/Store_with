#!/usr/bin/env bash
# גיבוי מסד הנתונים והתמונות שהועלו. הרצה: DATABASE_URL=... UPLOAD_DIR=... ./scripts/backup.sh [תיקיית יעד]
# מומלץ להריץ מדי יום (cron) ולהעתיק את התוצאה למקום חיצוני.
set -euo pipefail
OUT="${1:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT"
: "${DATABASE_URL:?יש להגדיר DATABASE_URL}"
pg_dump "$DATABASE_URL" | gzip > "$OUT/db-$STAMP.sql.gz"
if [ -d "${UPLOAD_DIR:-./uploads}" ]; then
  tar -czf "$OUT/uploads-$STAMP.tar.gz" -C "${UPLOAD_DIR:-./uploads}" .
fi
# שומרים 14 גיבויים אחרונים מכל סוג
ls -1t "$OUT"/db-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --
ls -1t "$OUT"/uploads-*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm --
echo "הגיבוי נשמר ב-$OUT ($STAMP)"
