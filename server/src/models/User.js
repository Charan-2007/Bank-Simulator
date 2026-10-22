import mongoose from 'mongoose';
import { LIMITS } from '../config/limits.js';

const RefreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    device: { type: String, default: 'Unknown' }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    nationality: {
      type: String,
      default: 'Indian',
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'active'],
      default: 'pending',
      index: true
    },
    pinHash: {
      type: String,
      default: null
    },
    failedPinAttempts: {
      type: Number,
      default: 0
    },
    pinLockedUntil: {
      type: Date,
      default: null
    },
    accountNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    balancePaise: {
      type: Number,
      required: true,
      default: LIMITS.STARTING_BALANCE_PAISE // 1,000,000 = ₹10,000
    },
    selectedCardId: {
      type: String,
      default: 'abstract-black-hole'
    },
    demoCardNumber: {
      type: String,
      default: null
    },
    settings: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      glassEffect: {
        type: String,
        enum: ['auto', 'full', 'lite', 'off'],
        default: 'auto'
      },
      reducedMotion: {
        type: Boolean,
        default: false
      },
      cardAnimation: {
        type: String,
        enum: ['off', 'low', 'mid', 'high', 'max'],
        default: 'mid'
      },
      haptics: {
        type: Boolean,
        default: true
      }
    },
    refreshTokens: [RefreshTokenSchema]
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model('User', UserSchema);
