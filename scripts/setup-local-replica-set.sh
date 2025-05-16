#!/bin/bash

# Create directories for the replica set members
mkdir -p ~/data/db/rs0-0
mkdir -p ~/data/db/rs0-1
mkdir -p ~/data/db/rs0-2

# Stop any running MongoDB instance
pkill -f mongod || true
sleep 2

# Start MongoDB instances with replica set configuration
mongod --replSet rs0 --port 27017 --bind_ip localhost --dbpath ~/data/db/rs0-0 --fork --logpath ~/data/db/rs0-0/mongod.log
mongod --replSet rs0 --port 27018 --bind_ip localhost --dbpath ~/data/db/rs0-1 --fork --logpath ~/data/db/rs0-1/mongod.log
mongod --replSet rs0 --port 27019 --bind_ip localhost --dbpath ~/data/db/rs0-2 --fork --logpath ~/data/db/rs0-2/mongod.log

# Wait for MongoDB to start
sleep 2

# Initialize the replica set
mongosh --port 27017 --eval '
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017", priority: 2 },
    { _id: 1, host: "localhost:27018", priority: 1 },
    { _id: 2, host: "localhost:27019", priority: 1 }
  ]
});
'

# Wait for replica set to initialize
sleep 5

# Check replica set status
mongosh --port 27017 --eval 'rs.status();'

# Initialize collections for the ETL pipeline
mongosh --port 27017 --eval '
db = db.getSiblingDB("etl-pipeline");
db.createCollection("orders");
db.createCollection("devices");
db.createCollection("useractivities");
'

echo "MongoDB replica set 'rs0' is now configured and running."
echo "Connection string: mongodb://localhost:27017,localhost:27018,localhost:27019/etl-pipeline?replicaSet=rs0" 