import dayjs from 'dayjs';
// **MODIFIED**: Added .js extension to the plugin imports
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { getMainDb, getTestDb } from '../../shared/config/db.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

const LOG_COLLECTION = 'raw_logger_data';

/**
 * Saves a pre-formatted batch of packets to both myDatabase and testDatabase.
 * This is now a simple, stateless function.
 */
export async function saveLoggerPacketsBulk(packets) {
    if (!packets || packets.length === 0) {
        return;
    }

    try {
        // Get both database connections
        const mainDb = await getMainDb();
        const testDb = await getTestDb();

        // Insert into myDatabase
        try {
            await mainDb.collection(LOG_COLLECTION).insertMany(packets, { ordered: false });
            console.log(`🚀 Flushed ${packets.length} packets to myDatabase.${LOG_COLLECTION}`);
        } catch (err) {
            console.error(`❌ InsertMany failed for myDatabase.${LOG_COLLECTION}.`, err.message);
            throw err;
        }

        // Insert into testDatabase
        try {
            await testDb.collection(LOG_COLLECTION).insertMany(packets, { ordered: false });
            console.log(`🚀 Flushed ${packets.length} packets to testDatabase.${LOG_COLLECTION}`);
        } catch (err) {
            console.error(`❌ InsertMany failed for testDatabase.${LOG_COLLECTION}.`, err.message);
            throw err;
        }

    } catch (err) {
        console.error(`❌ Database operation failed.`, err.message);
        // Re-throw the error so BullMQ knows the batch failed
        // and can retry it.
        throw err;
    }
}