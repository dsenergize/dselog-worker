import { Worker } from 'bullmq';
import { redisConnection } from '../shared/config/bullmq.js';
import { bufferLoggerPacket } from './services/databaseService.js';
import { getDb } from '../shared/config/db.js';

console.log('Starting Database Worker...');

getDb().then(() => {
    const worker = new Worker('logger-packets', async (job) => {
        const originalPacket = job.data?.packet;

        if (!originalPacket) {
            console.warn('Job has no packet data to process:', job.id);
            return;
        }

        // **MODIFIED**: This is the new transformation step.
        // It takes the incoming data and wraps it in the desired DB structure.
        const coreData = originalPacket.data || originalPacket;
        const transformedPacket = {
            response: {
                data: coreData
            }
        };

        // Pass the newly structured packet to the database service
        await bufferLoggerPacket(transformedPacket);

    }, { ...redisConnection });

    worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job.id} failed:`, err.message);
    });

    console.log('🛠️  Worker is listening for jobs on the "logger-packets" queue...');
});