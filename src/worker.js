import 'dotenv/config';
import { Worker } from 'bullmq';
import { redisConnection } from '../shared/config/bullmq.js';
import { saveLoggerPacketsBulk } from './services/databaseService.js';
import { getDb } from '../shared/config/db.js';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

const BATCH_SIZE = 5000;

console.log('Starting Database Worker (Robust Mode)...');

/**
 * Transforms a single BullMQ job object into the database document.
 */
function transformJobToPacket(job) {
    if (!job || !job.data) {
        console.warn('Skipping job with no data');
        return null;
    }
    const originalPacket = job.data?.packet;

    const coreData = originalPacket?.data || originalPacket;
    if (!coreData) {
        console.warn('Job has no packet data to process:', job.id);
        return null; // Will be filtered out
    }

    const transformedPacket = {
        response: {
            data: coreData
        }
    };

    const dtm = coreData.dtm || coreData.time;
    const eventTime = dayjs.utc(dtm, "YYYYMMDDHHmmss").toDate();

    return {
        ...transformedPacket,
        insertiontime: new Date(),
        eventTime: eventTime,
    };
}


/**
 * This is the new robust processor.
 * It now accepts an 'arg' which could be a single job or an array of jobs.
 */
const robustProcessor = async (arg) => {
    let packetsToSave = [];

    if (Array.isArray(arg)) {
        // --- BULK MODE ---
        // This is what *should* be happening.
        console.log(`Processing batch of ${arg.length} jobs...`);
        packetsToSave = arg.map(transformJobToPacket).filter(Boolean);
    } else if (arg && typeof arg === 'object' && arg.data) {
        // --- SINGLE JOB MODE ---
        // This is what is *actually* happening (the bug).
        console.warn(`[WORKER_BUG] Running in single-job mode for job ${arg.id}. Processing one.`);
        const packet = transformJobToPacket(arg);
        if (packet) {
            packetsToSave.push(packet);
        }
    } else {
        // --- UNKNOWN MODE ---
        console.error(`❌ FATAL: Processor received unknown argument type: ${typeof arg}`);
        throw new Error('Processor received unknown argument.');
    }

    // Save whatever packets we managed to transform
    if (packetsToSave.length > 0) {
        await saveLoggerPacketsBulk(packetsToSave);
    }
};


getDb().then(() => {
    console.log('Database connection established. Creating worker...');
    
    const worker = new Worker(
        'logger-packets',
        robustProcessor, // Use the new robust processor
        {
            ...redisConnection,
            // **MODIFIED**: Let's try concurrency 2, as 1 might be buggy
            concurrency: 2, 
            processBulk: true,
            maxJobsToProcessPerPick: BATCH_SIZE
        }
    );

    worker.on('failed', (jobOrJobs, err) => {
        console.error(`❌ Job/Batch failed:`, err.message);
    });
    
    worker.on('error', (err) => {
        console.error('Worker encountered an error:', err);
    });

    console.log(`🛠️ Worker is listening for batches (size ${BATCH_SIZE}) on the "logger-packets" queue...`);
});