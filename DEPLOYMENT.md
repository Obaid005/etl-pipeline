# Deployment Guide

This guide provides instructions for deploying the ETL Pipeline application to production environments.

## Prerequisites

- Docker and Docker Compose installed on the server
- Access to a MongoDB instance (preferably a replica set)
- Git to clone the repository

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/etl-pipeline.git
cd etl-pipeline
```

### 2. Configure Environment Variables

Create a `.env` file in the project root with your production settings:

```bash
# MongoDB connection string
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/etl-pipeline?retryWrites=true&w=majority

# Application port (default: 3000)
PORT=3000

# RabbitMQ settings (if needed)
RABBITMQ_USER=your_rabbitmq_user
RABBITMQ_PASS=your_rabbitmq_password
RABBITMQ_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672

# Redis settings (if needed)
REDIS_PORT=6379

# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Node environment
NODE_ENV=production
```

Or you can set these environment variables directly in your deployment environment.

### 3. Deploy with Docker Compose

The recommended way to deploy the application is using Docker Compose:

```bash
# Export your MongoDB connection string
export MONGO_URI='your-mongodb-connection-string'

# Deploy the application
./scripts/docker-deploy.sh prod
```

This will:
1. Build the Docker images
2. Start the containers
3. Set up RabbitMQ and Redis
4. Start the ETL pipeline application

### 4. Verify Deployment

Check that all services are running:

```bash
./scripts/docker-deploy.sh status prod
```

Verify the application health:

```bash
curl http://localhost:3000/health
```

### 5. Production Maintenance

#### Viewing Logs

To view application logs:

```bash
./scripts/docker-deploy.sh logs prod
```

#### Restarting Services

To restart all services:

```bash
./scripts/docker-deploy.sh restart prod
```

#### Stopping the Application

To stop all services:

```bash
./scripts/docker-deploy.sh down prod
```

#### Updating the Application

To update the application:

```bash
# Pull the latest changes
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml build
./scripts/docker-deploy.sh restart prod
```

## Alternative Deployment Methods

### Kubernetes Deployment

For larger scale deployments, consider using Kubernetes:

1. Create Kubernetes YAML configurations for each service
2. Use Kubernetes secrets for sensitive information
3. Deploy using `kubectl apply -f k8s/`

### Serverless Deployment

For certain components, serverless deployment might be appropriate:
- CDC events can be handled using cloud functions
- Message processing can be managed with serverless queues

## Production Considerations

### Scaling

- Use a managed MongoDB service with auto-scaling capabilities
- Configure RabbitMQ clustering for high message throughput
- Consider using a CDN if serving public content

### Monitoring

- Set up health checks for all services
- Implement application metrics and monitoring
- Configure alerts for critical errors

### Security

- Secure MongoDB with proper authentication and network rules
- Use HTTPS for all public endpoints
- Implement proper access controls and authentication
- Secure environment variables and sensitive data

### Backup

- Set up regular database backups
- Implement disaster recovery plans
- Test restores regularly

## Troubleshooting

### Container Startup Issues

If containers fail to start, check:
- Docker logs: `docker logs container_name`
- Environment variables: `docker compose -f docker-compose.prod.yml config`
- Networking issues: `docker network inspect etl-pipeline_etl-network`

### MongoDB Connectivity Issues

If the application can't connect to MongoDB:
- Verify MongoDB connection string
- Check network connectivity and firewall rules
- Ensure MongoDB user has correct permissions

### Performance Issues

For performance problems:
- Check MongoDB query performance
- Monitor RabbitMQ queue sizes
- Look for bottlenecks in message processing
- Consider scaling resources or optimizing code 