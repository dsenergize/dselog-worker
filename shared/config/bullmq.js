import { Queue, Worker } from 'bullmq';
import 'dotenv/config';

const redisUrl = new URL(process.env.REDIS_URL);

// This connection object is used by both Queues and Workers
export const redisConnection = {
  connection: {
    host: redisUrl.hostname,
    port: redisUrl.port,
    username: redisUrl.username,
    password: redisUrl.password,
    tls: redisUrl.protocol === 'rediss:' ? {} : undefined, // Enable TLS for rediss:// URLs
  },
};

export const loggerQueue = new Queue('logger-packets', redisConnection);
export const debugQueue = new Queue('debug-packets', redisConnection);

console.log('BullMQ config loaded. Ready to connect to Redis...');