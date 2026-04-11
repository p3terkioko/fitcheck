#!/usr/bin/env bash
set -euo pipefail

cd /var/www/fitcheck/ml_service
/var/www/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
