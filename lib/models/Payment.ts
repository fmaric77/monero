import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPayment extends Document {
  paymentId: string;
  userId: Types.ObjectId;
  amount: number;
  status: 'pending' | 'completed' | 'expired' | 'failed';
  transactionHash?: string;
  expiresAt: Date;
  completedAt?: Date;
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

