#!/bin/sh
set -e

# Health check for the ETL Pipeline application
# 1. Check if the app is running on port 3000
nc -z localhost 3000 || exit 1

# 2. Check if the app is responding to health endpoint
wget -q -O- http://localhost:3000/health || exit 1

# All checks passed
exit 0 