#!/bin/bash
set -e

# Wait for MongoDB primary to be ready
sleep 10
echo "Checking if MongoDB replica set needs initialization..."

# Check if replica set is already initialized
INITIALIZED=$(mongosh --host mongodb-primary:27017 --quiet --eval 'rs.status().ok' 2>/dev/null || echo 0)

if [ "$INITIALIZED" == "1" ]; then
  echo "MongoDB replica set is already initialized!"
else
  echo "Initializing MongoDB replica set..."
  mongosh --host mongodb-primary:27017 --eval '
    rs.initiate({
      _id: "rs0", 
      members: [
        { _id: 0, host: "mongodb-primary:27017", priority: 2 },
        { _id: 1, host: "mongodb-secondary-1:27017", priority: 1 },
        { _id: 2, host: "mongodb-secondary-2:27017", priority: 1 }
      ]
    });
  '
fi

# Wait for replica set to stabilize
sleep 10
echo "Waiting for primary to be ready..."

# Make sure we're connected to the primary
MAX_RETRY=30
RETRY_COUNT=0
PRIMARY_READY=0

while [ $PRIMARY_READY -eq 0 ] && [ $RETRY_COUNT -lt $MAX_RETRY ]; do
  PRIMARY_STATUS=$(mongosh --host mongodb-primary:27017 --quiet --eval 'db.isMaster().ismaster' 2>/dev/null || echo "false")
  
  if [ "$PRIMARY_STATUS" == "true" ]; then
    PRIMARY_READY=1
    echo "Primary is ready!"
  else
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "Waiting for primary node to be ready... Attempt $RETRY_COUNT of $MAX_RETRY"
    sleep 2
  fi
done

if [ $PRIMARY_READY -eq 0 ]; then
  echo "ERROR: Primary node did not become ready within the timeout period. Exiting."
  exit 1
fi

# Create collections if they don't exist
echo "Creating collections if they do not exist..."
mongosh --host mongodb-primary:27017 --eval '
  db = db.getSiblingDB("etl-pipeline");
  try {
    db.createCollection("orders");
    print("Orders collection created or already exists");
  } catch(err) {
    if(!err.message.includes("already exists")) {
      print("Error creating orders collection: " + err.message);
      throw err;
    }
  }
  try {
    db.createCollection("devices");
    print("Devices collection created or already exists");
  } catch(err) {
    if(!err.message.includes("already exists")) {
      print("Error creating devices collection: " + err.message);
      throw err;
    }
  }
  try {
    db.createCollection("useractivities");
    print("UserActivities collection created or already exists");
  } catch(err) {
    if(!err.message.includes("already exists")) {
      print("Error creating useractivities collection: " + err.message);
      throw err;
    }
  }
  print("Collections check completed.");
'

echo "MongoDB initialization completed successfully!"
# Creating a flag file to prevent reinitialization
touch /tmp/mongo_initialized 