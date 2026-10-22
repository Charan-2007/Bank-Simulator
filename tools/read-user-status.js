import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const timer = setTimeout(() => {
  console.log('Timeout');
  process.exit(1);
}, 15000);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Otp = mongoose.model('Otp', new mongoose.Schema({}, { strict: false }));
  
  const phones = ['+917777777777', '+918888888888', '8888888888', '7777777777'];
  const users = await User.find({ phone: { $in: phones } });
  const otps = await Otp.find({ phone: { $in: phones } });
  
  console.log('USERS FOUND:', JSON.stringify(users.map(u => ({ id: u._id, phone: u.phone, status: u.status, name: u.name, pinHash: !!u.pinHash }))));
  console.log('OTPS FOUND:', JSON.stringify(otps.map(o => ({ id: o._id, phone: o.phone, attempts: o.attempts, expiresAt: o.expiresAt }))));
  
  await mongoose.disconnect();
  clearTimeout(timer);
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  clearTimeout(timer);
  process.exit(1);
});
