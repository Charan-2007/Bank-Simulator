import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true
    },
    codeHash: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0 // MongoDB TTL index: document removed when expiresAt < now
    }
  },
  {
    timestamps: true
  }
);

export const Otp = mongoose.model('Otp', OtpSchema);
