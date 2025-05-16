#!/bin/bash
set -e

# This script completely rebuilds the Docker environment from scratch
# It removes all containers, volumes, and rebuilds images
# Use with caution as it will DELETE ALL DATA

# Function to confirm action
confirm() {
  echo "⚠️  WARNING: This will DELETE ALL DATA and rebuild the Docker environment from scratch."
  echo "All MongoDB data, SQLite files, and other persistent data will be lost."
  echo ""
  read -p "Are you sure you want to continue? (y/N): " choice
  case "$choice" in 
    y|Y ) return 0;;
    * ) echo "Operation cancelled"; exit 1;;
  esac
}

# Confirm action
confirm

echo "🛑 Stopping all containers..."
docker compose down --remove-orphans

echo "🗑️  Removing volumes..."
docker compose down -v

echo "🧹 Pruning unused volumes..."
docker volume prune -f

echo "🔄 Rebuilding images..."
docker compose build --no-cache

echo "🚀 Starting fresh environment..."
./scripts/docker-deploy.sh dev

echo "✅ Done! Fresh environment is starting up."
echo "You can view logs with: ./scripts/docker-deploy.sh logs" 