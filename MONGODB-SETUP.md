# MongoDB Setup Guide

This guide explains how to set up MongoDB for both local development and production environments.

## Local Development Setup

For local development, we need to set up a MongoDB replica set to enable Change Streams functionality.

### Prerequisites

- MongoDB installed locally (version 4.0 or higher)
- MongoDB Shell (mongosh)

### Setting Up the Replica Set

We've provided scripts to simplify the replica set setup process:

#### 1. Start the Replica Set

Run the setup script:

```bash
./scripts/setup-local-replica-set.sh
```

This script will:
- Create three data directories for MongoDB instances
- Start three MongoDB instances on ports 27017, 27018, and 27019
- Configure them as a replica set named "rs0"
- Create required collections for the ETL pipeline

#### 2. Check Replica Set Status

To verify that your replica set is working correctly:

```bash
./scripts/check-replica-status.sh
```

The output should show a healthy replica set with one PRIMARY and two SECONDARY members.

#### 3. Reset the Replica Set

If you need to reset your replica set (e.g., if something goes wrong):

```bash
./scripts/reset-local-mongodb.sh
```

### Connecting to the Local Replica Set

Update your `.env.local` file with the correct MongoDB URI:

```
MONGO_URI=mongodb://localhost:27017,localhost:27018,localhost:27019/etl-pipeline?replicaSet=rs0
```

## Production Setup

For production environments, it's recommended to use a managed MongoDB service like MongoDB Atlas, AWS DocumentDB, or a self-managed MongoDB deployment with proper administration.

### Using MongoDB Atlas

MongoDB Atlas is a cloud-based MongoDB service that handles replication, security, and backups for you.

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (M0 free tier is available for testing)
3. Set up network access (IP whitelisting)
4. Create a database user
5. Get your connection string from the Atlas dashboard

Your connection string will look like:
```
mongodb+srv://username:password@cluster.mongodb.net/etl-pipeline?retryWrites=true&w=majority
```

### Using Self-Managed MongoDB

If you're managing your own MongoDB deployment:

1. Set up a replica set with at least 3 nodes for high availability
2. Configure proper security (authentication, network security)
3. Create a database user with appropriate permissions
4. Use a connection string that includes all replica set members

Your connection string should look like:
```
mongodb://host1:port1,host2:port2,host3:port3/etl-pipeline?replicaSet=rs0
```

### Deploying with Docker in Production

When deploying the ETL pipeline to production with Docker:

1. Set the MONGO_URI environment variable to your production connection string:
   ```bash
   export MONGO_URI='your-production-mongodb-connection-string'
   ```

2. Start the production containers:
   ```bash
   ./scripts/docker-deploy.sh prod
   ```

The production Docker setup doesn't include MongoDB containers, as it expects to use an external MongoDB service.

## Troubleshooting

### Cannot Connect to MongoDB

If you're having trouble connecting to MongoDB:
- Check your connection string format
- Verify network connectivity and firewall settings
- Ensure proper authentication credentials
- Verify that the MongoDB service is running

### Change Streams Not Working

If Change Streams aren't working:
- Verify the MongoDB deployment is a replica set
- Check that your connection string includes the `replicaSet` parameter
- Ensure your MongoDB user has the necessary permissions
- Verify your MongoDB version supports Change Streams (4.0+)

### Manual Local Setup (if scripts don't work)

If you need to set up the local replica set manually:

1. Create data directories:
```bash
mkdir -p ~/data/db/rs0-0 ~/data/db/rs0-1 ~/data/db/rs0-2
```

2. Start MongoDB instances:
```bash
mongod --replSet rs0 --port 27017 --dbpath ~/data/db/rs0-0 --bind_ip localhost --fork --logpath ~/data/db/rs0-0/mongod.log
mongod --replSet rs0 --port 27018 --dbpath ~/data/db/rs0-1 --bind_ip localhost --fork --logpath ~/data/db/rs0-1/mongod.log
mongod --replSet rs0 --port 27019 --dbpath ~/data/db/rs0-2 --bind_ip localhost --fork --logpath ~/data/db/rs0-2/mongod.log
```

3. Initialize the replica set:
```bash
mongosh --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017", priority: 2}, {_id: 1, host: "localhost:27018", priority: 1}, {_id: 2, host: "localhost:27019", priority: 1}]})'
```

4. Create collections:
```bash
mongosh --eval 'db = db.getSiblingDB("etl-pipeline"); db.createCollection("orders"); db.createCollection("devices"); db.createCollection("useractivities");'
``` 