import dayjs from 'dayjs';
// **MODIFIED**: Added .js extension to the plugin imports
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { getDb } from '../../../shared/config/db.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

const LOG_COLLECTION = 'raw_logger_data';
const FLUSH_LIMIT = 500;
const FLUSH_INTERVAL = 10000; // 10 seconds

let packetBuffer = [];

export async function bufferLoggerPacket(transformedPacket) {
  const coreData = transformedPacket.response.data;
  const dtm = coreData.dtm || coreData.time;
  const eventTime = dayjs.utc(dtm, "YYYYMMDDHHmmss").toDate();

  const documentToSave = {
    ...transformedPacket,
    insertiontime: new Date(),
    eventTime: eventTime,
  };

  packetBuffer.push(documentToSave);

  console.log(`📦 Buffer size: ${packetBuffer.length}`);
  if (packetBuffer.length >= FLUSH_LIMIT) {
    await flushBuffer();
  }
}

async function flushBuffer() {
  if (packetBuffer.length === 0) return;

  const connection = await getDb();
  const docsToInsert = [...packetBuffer];
  packetBuffer = [];

  try {
    await connection.collection(LOG_COLLECTION).insertMany(docsToInsert, { ordered: false });
    console.log(`🚀 Flushed ${docsToInsert.length} packets to ${LOG_COLLECTION}`);
  } catch (err) {
    console.error(`❌ InsertMany failed for ${LOG_COLLECTION}. Retrying...`, err.message);
    packetBuffer.push(...docsToInsert);
  }
}

setInterval(flushBuffer, FLUSH_INTERVAL);