#!/bin/sh
set -e

cd /app/ms_dome

python manage.py migrate --noinput

exec gunicorn ms_dome.wsgi:application \
    --bind "0.0.0.0:${PORT:-8000}" \
    --workers "${GUNICORN_WORKERS:-4}"
