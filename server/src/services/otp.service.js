import bcrypt from 'bcrypt';
import { Otp } from '../models/Otp.js';

export async function requestOtp(phone) {
  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

  // Replace any active OTP for this phone
  await Otp.deleteMany({ phone });

  await Otp.create({
    phone,
    codeHash,
    attempts: 0,
    expiresAt
  });

  return code;
}

export async function verifyOtp(phone, code) {
  const otpRecord = await Otp.findOne({ phone });

  if (!otpRecord) {
    const err = new Error('Invalid or expired OTP');
    err.statusCode = 400;
    throw err;
  }

  if (new Date() > otpRecord.expiresAt) {
    await Otp.deleteOne({ _id: otpRecord._id });
    const err = new Error('OTP has expired');
    err.statusCode = 400;
    throw err;
  }

  if (otpRecord.attempts >= 5) {
    await Otp.deleteOne({ _id: otpRecord._id });
    const err = new Error('Maximum OTP verification attempts exceeded');
    err.statusCode = 400;
    throw err;
  }

  const isMatch = await bcrypt.compare(code, otpRecord.codeHash);
  if (!isMatch) {
    otpRecord.attempts += 1;
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      const err = new Error('Maximum OTP verification attempts exceeded');
      err.statusCode = 400;
      throw err;
    }
    await otpRecord.save();
    const remaining = 5 - otpRecord.attempts;
    const err = new Error(`Invalid OTP code. ${remaining} attempt(s) remaining.`);
    err.statusCode = 400;
    throw err;
  }

  // OTP verified successfully; remove record
  await Otp.deleteOne({ _id: otpRecord._id });
  return true;
}
