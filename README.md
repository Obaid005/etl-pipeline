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

## Architecture

The pipeline consists of five main components:

1. **MongoDB** as the source database
2. **Change Data Capture (CDC)** using MongoDB Change Streams to detect changes
3. **RabbitMQ** as the message queue for decoupling producers and consumers
4. **Spark Module** (simulated) for data processing and transformation
5. **SQLite** as the data warehouse for storing processed data

## Flow

1. The CDC service listens to changes in MongoDB collections (Orders, Devices, User Activities)
2. When changes are detected, they are published to RabbitMQ
3. The Spark service consumes messages from RabbitMQ, processes them in batches
4. Transformed data is stored in SQLite database for analytics

## Setup

### Prerequisites

- Node.js (v18+)
- MongoDB
- RabbitMQ

### Installation

```bash
npm install
```

### Configuration

Edit the configuration in `src/config/configuration.ts` to match your environment:

```typescript
export default () => ({
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/etl-pipeline',
  },
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE || 'cdc_events',
  },
  sqlite: {
    database: process.env.SQLITE_DATABASE || './data/warehouse.db',
    tables: {
      orders: process.env.SQLITE_ORDERS_TABLE || 'orders',
      devices: process.env.SQLITE_DEVICES_TABLE || 'devices',
      userActivities: process.env.SQLITE_USER_ACTIVITIES_TABLE || 'user_activities',
    },
  },
});
```

### Running the application

```bash
npm run start:dev
```

## Database Schemas

### MongoDB

The MongoDB database contains the following collections:
- Orders
- Devices
- User Activities

### SQLite Warehouse

The SQLite database contains corresponding tables with transformed and enriched data.

## Data Transformation

The Spark service (simulated in this implementation) applies the following transformations:

1. **Orders**: Calculates tax, subtotal, and total amount
2. **Devices**: Categorizes devices, calculates days since registration
3. **User Activities**: Enriches with time of day, weekday, and geographic information

## License

MIT
