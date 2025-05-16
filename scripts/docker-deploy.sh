#!/bin/bash
set -e

# Helper script for managing Docker deployments
# Usage: ./scripts/docker-deploy.sh [dev|prod|down|logs|restart|status] [environment]

# Get the command from arguments
CMD=${1:-dev}

case $CMD in
  dev)
    echo "Starting development environment..."
    docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
    echo "Development environment started. View logs with: ./scripts/docker-deploy.sh logs"
    ;;
    
  prod)
    echo "Starting production environment..."
    
    # Check if MONGO_URI is set
    if [ -z "$MONGO_URI" ]; then
      echo "ERROR: MONGO_URI environment variable is not set."
      echo "Please set MONGO_URI to your production MongoDB connection string."
      echo "Example: export MONGO_URI='mongodb+srv://username:password@cluster.mongodb.net/etl-pipeline?retryWrites=true&w=majority'"
      exit 1
    fi
    
    docker compose -f docker-compose.prod.yml up -d
    echo "Production environment started. View logs with: ./scripts/docker-deploy.sh logs prod"
    ;;
    
  down)
    ENV=${2:-dev}
    if [ "$ENV" = "prod" ]; then
      echo "Stopping production containers..."
      docker compose -f docker-compose.prod.yml down
    else
      echo "Stopping development containers..."
      docker compose -f docker-compose.yml -f docker-compose.override.yml down
    fi
    echo "Containers stopped."
    ;;
    
  logs)
    ENV=${2:-dev}
    echo "Showing logs for $ENV environment (press Ctrl+C to exit)..."
    if [ "$ENV" = "prod" ]; then
      docker compose -f docker-compose.prod.yml logs -f
    else
      docker compose -f docker-compose.yml -f docker-compose.override.yml logs -f
    fi
    ;;
    
  restart)
    ENV=${2:-dev}
    if [ "$ENV" = "prod" ]; then
      echo "Restarting production containers..."
      docker compose -f docker-compose.prod.yml restart
    else
      echo "Restarting development containers..."
      docker compose -f docker-compose.yml -f docker-compose.override.yml restart
    fi
    echo "Containers restarted."
    ;;
    
  status)
    ENV=${2:-dev}
    echo "Checking container status for $ENV environment..."
    if [ "$ENV" = "prod" ]; then
      docker compose -f docker-compose.prod.yml ps
    else
      docker compose -f docker-compose.yml -f docker-compose.override.yml ps
    fi
    ;;
    
  *)
    echo "Unknown command: $CMD"
    echo "Usage: ./scripts/docker-deploy.sh [dev|prod|down|logs|restart|status] [environment]"
    echo "Environment can be 'dev' (default) or 'prod'"
    exit 1
    ;;
esac 