#!/bin/bash

echo "Checking MongoDB replica set status..."
mongosh --eval 'rs.status();' 