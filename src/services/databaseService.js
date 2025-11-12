import dayjs from 'dayjs';
// **MODIFIED**: Added .js extension to the plugin imports
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { getDb } from '../../shared/config/db.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

const LOG_COLLECTION = 'raw_logger_data';

/**
 * Saves a pre-formatted batch of packets to the database.
 * This is now a simple, stateless function.
 */
export async function saveLoggerPacketsBulk(packets) {
    if (!packets || packets.length === 0) {
        return;
    }

    const connection = await getDb();

    try {
        await connection.collection(LOG_COLLECTION).insertMany(packets, { ordered: false });
        console.log(`🚀 Flushed ${packets.length} packets to ${LOG_COLLECTION}`);
    } catch (err) {
        console.error(`❌ InsertMany failed for ${LOG_COLLECTION}.`, err.message);
        // Re-throw the error so BullMQ knows the batch failed
        // and can retry it.
        throw err;
    }
}