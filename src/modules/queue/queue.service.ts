import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: amqp.ChannelModel | null;
  private channel: amqp.Channel | null;
  private readonly queueName: string;
  private consumer: amqp.Replies.Consume | null;

  constructor(private readonly configService: ConfigService) {
    this.queueName =
      this.configService.get<string>('rabbitmq.queue') || 'cdc_events';
  }

  async onModuleInit() {
    await this.initializeRabbitMQ();
    this.logger.log('RabbitMQ connection established');
  }

  async onModuleDestroy() {
    await this.closeConnection();
    this.logger.log('RabbitMQ connection closed');
  }

  async initializeRabbitMQ() {
    try {
      const uri = this.configService.get<string>('rabbitmq.uri') as string;

      // Establish connection
      this.connection = await amqp.connect(uri);

      // Create channel
      this.channel = await this.connection.createChannel();

      // Assert queue
      await this.channel.assertQueue(this.queueName, {
        durable: true,
      });

      // Handle connection errors
      this.connection.on('error', (error) => {
        this.logger.error('RabbitMQ connection error', error);
        this.reconnect();
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed. Trying to reconnect...');
        this.reconnect();
      });
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ', error);
      // Try to reconnect after a delay
      setTimeout(() => {
        this.reconnect();
      }, 5000);
    }
  }

  private async reconnect() {
    try {
      if (this.connection) {
        await this.closeConnection();
      }
      await this.initializeRabbitMQ();
      this.logger.log('Successfully reconnected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to reconnect to RabbitMQ', error);
      // Try again after a delay
      setTimeout(() => {
        this.reconnect();
      }, 5000);
    }
  }

  async sendToQueue(data: any) {
    try {
      if (!this.channel) {
        await this.initializeRabbitMQ();
      } else {
        const messageBuffer = Buffer.from(JSON.stringify(data));

        const result = this.channel.sendToQueue(this.queueName, messageBuffer, {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
        });

        if (result) {
          this.logger.debug(`Message sent to queue ${this.queueName}`);
        } else {
          this.logger.warn(
            'Channel write buffer is full. Consider implementing flow control.',
          );
        }

        return result;
      }
    } catch (error) {
      this.logger.error('Error sending message to queue', error);
      throw error;
    }
  }

  async consumeFromQueue(callback: (message: any) => void) {
    try {
      if (!this.channel) {
        await this.initializeRabbitMQ();
      } else {
        // Make sure we prefetch only one message at a time to distribute load
        await this.channel.prefetch(1);

        // Start consuming messages
        this.consumer = await this.channel.consume(
          this.queueName,
          (msg) => {
            if (msg) {
              try {
                // Parse message content
                const content = msg.content.toString();
                const message = JSON.parse(content) as object;

                // Process message with callback
                callback(message);

                // Acknowledge message
                this.channel?.ack(msg);
              } catch (error) {
                this.logger.error('Error processing message', error);
                // Reject and requeue the message for retry
                this.channel?.nack(msg, false, true);
              }
            }
          },
          {
            noAck: false, // Manual acknowledgment
          },
        );

        this.logger.log(`Started consuming from queue: ${this.queueName}`);
        return this.consumer;
      }
    } catch (error) {
      this.logger.error('Error setting up consumer', error);
      throw error;
    }
  }

  async cancelConsumer() {
    if (this.consumer && this.channel) {
      try {
        await this.channel.cancel(this.consumer.consumerTag);
        this.logger.log(`Consumer ${this.consumer.consumerTag} cancelled`);
        this.consumer = null;
      } catch (error) {
        this.logger.error('Error cancelling consumer', error);
      }
    }
  }

  async closeConnection() {
    try {
      // Cancel consumer if active
      if (this.consumer) {
        await this.cancelConsumer();
      }

      if (this.channel) {
        await this.channel.close();
      }

      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }
}
