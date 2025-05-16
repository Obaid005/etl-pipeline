#!/bin/bash

echo "Stopping all MongoDB instances..."
pkill -f mongod || true
sleep 2

echo "Cleaning up data directories..."
rm -rf ~/data/db/rs0-0/*
rm -rf ~/data/db/rs0-1/*
rm -rf ~/data/db/rs0-2/*

echo "MongoDB cleanup complete. Run setup-local-replica-set.sh to restart the replica set." 