import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPayment extends Document {
  paymentId: string;
  userId: Types.ObjectId;
  amount: number;
  status: 'pending' | 'completed' | 'expired' | 'failed';
  address?: string; // Subaddress (pushed by mediator when generated)
  transactionHash?: string;
  expiresAt: Date;
  completedAt?: Date;
  feeSentAt?: Date;
  fundsForwardedAt?: Date;
  forwardingTxHash?: string;
  forwardingError?: string;
  forwardingRetryCount?: number;
  testnet: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired', 'failed'],
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: false,
    },
    transactionHash: {
      type: String,
      required: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      required: false,
    },
    feeSentAt: {
      type: Date,
      required: false,
    },
    fundsForwardedAt: {
      type: Date,
      required: false,
    },
    forwardingTxHash: {
      type: String,
      required: false,
    },
    forwardingError: {
      type: String,
      required: false,
    },
    forwardingRetryCount: {
      type: Number,
      required: false,
      default: 0,
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

// Ensure the model is only compiled once
let Payment: Model<IPayment>;
try {
  Payment = mongoose.model<IPayment>('Payment');
} catch {
  Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
}

export default Payment;

