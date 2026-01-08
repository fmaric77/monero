import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  publicKey: string;
  accountIndex?: number;
  passwordHash: string;
  apiKey: string;
  balance: number;
  webhookUrl?: string;
  testnet: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    publicKey: {
      type: String,
      required: true,
      index: true,
    },
    accountIndex: {
      type: Number,
      required: false,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    apiKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    webhookUrl: {
      type: String,
      required: false,
    },
    testnet: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for uniqueness per network
UserSchema.index({ publicKey: 1, testnet: 1 }, { unique: true });
UserSchema.index({ accountIndex: 1, testnet: 1 }, { unique: true, sparse: true });

// Ensure the model is only compiled once
let User: Model<IUser>;
try {
  User = mongoose.model<IUser>('User');
} catch {
  User = mongoose.model<IUser>('User', UserSchema);
}

export default User;

