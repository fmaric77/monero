import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  publicKey: string;
  accountIndex?: number;
  passwordHash: string;
  apiKey: string;
  balance: number;
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    publicKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accountIndex: {
      type: Number,
      required: false,
      unique: true,
      sparse: true,
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
  },
  {
    timestamps: true,
  }
);

// Ensure the model is only compiled once
let User: Model<IUser>;
try {
  User = mongoose.model<IUser>('User');
} catch {
  User = mongoose.model<IUser>('User', UserSchema);
}

export default User;

