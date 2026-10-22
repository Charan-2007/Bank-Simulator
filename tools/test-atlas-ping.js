import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

async function verifyAtlasConnection() {
  const hardTimeout = setTimeout(() => {
    console.error('Timed out after 30 seconds.');
    process.exit(1);
  }, 30000);
  hardTimeout.unref();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  // Extract ONLY hostname safely without exposing credentials
  let safeHost = 'Unknown';
  try {
    const match = uri.match(/@([^/?:]+)/);
    if (match) {
      safeHost = match[1];
    }
  } catch {
    safeHost = 'Atlas Cluster';
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });

    const adminDb = mongoose.connection.db.admin();

    // 1. Run ping command
    const pingResult = await adminDb.ping();

    // 2. Run hello command to check replica set metadata
    const helloResult = await adminDb.command({ hello: 1 });

    console.log('\n--- Atlas Connection Verification ---');
    console.log(`Cluster Host: ${safeHost}`);
    console.log(`Ping Result: ${pingResult.ok === 1 ? 'OK (1)' : 'Failed'}`);
    console.log(`Replica Set: ${helloResult.setName ? `Yes (setName: "${helloResult.setName}")` : 'No'}`);
    console.log(`Is Writable Primary: ${Boolean(helloResult.isWritablePrimary ?? helloResult.ismaster)}`);
    console.log(`Connection State: Ready (state: ${mongoose.connection.readyState})`);
    console.log('-------------------------------------\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\nConnection failed:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

verifyAtlasConnection();
