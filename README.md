<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

# ETL Pipeline with NestJS

A real-time ETL (Extract, Transform, Load) pipeline implementation using NestJS, MongoDB, RabbitMQ, and SQLite.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Setup Instructions](#setup-instructions)
- [Design Rationale](#design-rationale)
- [Trade-offs and Limitations](#trade-offs-and-limitations)
- [Testing the Pipeline](#testing-the-pipeline)
- [Advanced Documentation](#advanced-documentation)

## Architecture Overview

```
             +---------------------+
             |                     |
             |     MongoDB         |
             |                     |
             +---------+-----------+
                       |
                       | Changes
                       v
             +---------+-----------+
             |                     |
             |  Change Data        |
             |  Capture Service    |
             |                     |
             +---------+-----------+
                       |
                       | Events
                       v
             +---------+-----------+
             |                     |
             |     RabbitMQ        |
             |                     |
             +---------+-----------+
                       |
                       | Messages
                       v
             +---------+-----------+
             |                     |
             |    Spark Module     |
             |  (Transformation)   |
             |                     |
             +---------+-----------+
                       |
                       | Transformed Data
                       v
             +---------+-----------+
             |                     |
             |      SQLite         |
             |   Data Warehouse    |
             |                     |
             +---------------------+
```

> **Note:** A more detailed architecture diagram is available in HTML format at [docs/architecture.html](docs/architecture.html). You can view it by running `./scripts/view-architecture.sh` to open it automatically in your browser.

The pipeline consists of five main components:

1. **MongoDB** as the source database
2. **Change Data Capture (CDC)** using MongoDB Change Streams to detect changes
3. **RabbitMQ** as the message queue for decoupling producers and consumers
4. **Spark Module** (simulated) for data processing and transformation
5. **SQLite** as the data warehouse for storing processed data

### Data Flow

1. The CDC service listens to changes in MongoDB collections (Orders, Devices, User Activities)
   - Uses Change Streams for real-time change detection (requires MongoDB replica set)
   - Falls back to polling if Change Streams are not available
2. When changes are detected, they are published to RabbitMQ
3. The Spark service consumes messages from RabbitMQ, processes them in batches
4. Transformed data is stored in SQLite database for analytics

## Setup Instructions

### Prerequisites

- Docker and Docker Compose (recommended)
- Node.js (v18+) if running locally
- Git for cloning the repository

### Quick Start with Docker

The easiest way to run the entire application stack is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/your-username/etl-pipeline.git
cd etl-pipeline

# Start development environment (with hot reload)
./scripts/docker-deploy.sh dev

# View logs
./scripts/docker-deploy.sh logs

# Check container status
./scripts/docker-deploy.sh status

# Stop containers
./scripts/docker-deploy.sh down
```

### Production Deployment

For production deployment with an external MongoDB service:

```bash
# Set your MongoDB connection string
export MONGO_URI='mongodb+srv://username:password@cluster.mongodb.net/etl-pipeline?retryWrites=true&w=majority'

# Start production environment
./scripts/docker-deploy.sh prod
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Manual Setup

For setting up MongoDB replica set manually or running the application without Docker, see [MONGODB-SETUP.md](MONGODB-SETUP.md).

## Design Rationale

### MongoDB as Source Database

**Why MongoDB:**
- Flexible document model well-suited for evolving schemas
- Strong support for real-time change detection
- Scalable and production-ready

### Change Data Capture with MongoDB Change Streams

**Why Change Streams over alternatives:**
- **Native Integration**: Built directly into MongoDB with no additional services
- **Real-time Performance**: Low-latency change notifications via the oplog
- **Simplicity**: Fewer moving parts compared to Debezium or other CDC tools
- **Resilience**: Our implementation includes a polling fallback

For a detailed analysis of our CDC approach, see [REASONING.md](REASONING.md#change-data-capture-with-mongodb-change-streams).

### RabbitMQ as Message Broker

**Why RabbitMQ over alternatives:**
- **Message Routing**: Flexible exchange and queue routing patterns
- **Operational Simplicity**: Lower infrastructure requirements than Kafka
- **Reliability**: Supports persistent messages, dead-letter exchanges, and acknowledgments
- **NestJS Integration**: Well-supported in the NestJS ecosystem

For details on our messaging implementation, see [REASONING.md](REASONING.md#message-processing-with-rabbitmq).

### Spark Module for Processing

**Why a Spark-like module:**
- **Batch Processing**: Efficient processing of multiple records
- **Transformation Logic**: Centralized data transformation rules
- **Extensibility**: Modular approach to adding new transformation logic

Note: This is a simulated Spark module within NestJS, not Apache Spark. In a production environment with higher volumes, Apache Spark would be a natural extension.

### SQLite as Data Warehouse

**Why SQLite over cloud alternatives:**
- **Simplicity**: No additional infrastructure setup
- **Development Friendly**: Easy to work with during development
- **Cost-Effective**: Free alternative to paid cloud data warehouses
- **Sufficient for Demos**: Adequate for demonstrating the ETL concept

In a production environment, this could be replaced with BigQuery, Redshift, or Snowflake for scalability.

## Trade-offs and Limitations

### Change Data Capture

**Limitations:**
- **Replica Set Requirement**: MongoDB Change Streams only work with replica sets
- **Oplog Size Limitations**: Changes older than the oplog retention period are not captured
- **Reconnection Complexity**: Handling reconnections requires resume tokens

**Mitigations:**
- Polling fallback mechanism
- Docker environment includes a pre-configured replica set
- Resume token persistence for recovery

### Message Processing

**Trade-offs:**
- **At-least-once Delivery**: Messages may be processed more than once
- **Ordering Guarantees**: Queue-level ordering but not global ordering
- **Message Persistence**: Persistent messages have higher latency

**Mitigations:**
- Deduplication mechanisms
- Transaction support for critical operations
- Idempotent message consumers

### Data Warehouse

**Limitations:**
- **Scalability**: SQLite is single-writer and not suitable for high concurrency
- **Query Performance**: Limited advanced analytics capabilities
- **Storage Limits**: Not suitable for large-scale data warehousing

**Considerations for Production:**
- Replace with a cloud data warehouse for production workloads
- Implement proper data modeling and partitioning
- Consider columnar storage formats for analytical queries

## Testing the Pipeline

You can test the pipeline using the following API endpoints:

```bash
# Create a test order
curl -X POST http://localhost:3000/test/order -H "Content-Type: application/json" -d '{"customerId":"TEST-CUST-001"}'

# Create a test device
curl -X POST http://localhost:3000/test/device -H "Content-Type: application/json" -d '{"userId":"TEST-USER-001"}'

# Create a test user activity
curl -X POST http://localhost:3000/test/activity -H "Content-Type: application/json" -d '{"userId":"TEST-USER-001","type":"login"}'

# Check ETL status
curl http://localhost:3000/test/status

# Check application health
curl http://localhost:3000/health
```

## Advanced Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md): Detailed production deployment guide
- [MONGODB-SETUP.md](MONGODB-SETUP.md): MongoDB replica set configuration
- [REASONING.md](REASONING.md): In-depth technical rationale for design choices
- [Architecture Diagram](docs/architecture.html): Interactive visualization of the system architecture (open in browser or run `./scripts/view-architecture.sh`)

## License

MIT
