import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireInternalSecret } from '@/lib/auth';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';
import { paymentUpdateSchema } from '@/types';
import { deliverPaymentWebhook } from '@/lib/webhook';

export const dynamic = 'force-dynamic';

/**
 * POST /api/internal/payment-update
 * Localhost app pushes payment status updates
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = requireInternalSecret(request);
    if (authCheck) {
      return authCheck;
    }

    await dbConnect();

    const body = await request.json();
    const validationResult = paymentUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { paymentId, status, address, transactionHash, completedAt } =
      validationResult.data;

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update payment
    if (status) payment.status = status;
    if (address) payment.address = address; // Update subaddress when mediator generates it
    if (transactionHash) payment.transactionHash = transactionHash;
    if (completedAt) payment.completedAt = new Date(completedAt);

    await payment.save();

    // If payment is completed and user has webhook, trigger webhook
    if (status === 'completed' && payment.transactionHash) {
      const user = await User.findById(payment.userId);
      if (user?.webhookUrl) {
        deliverPaymentWebhook(
          user.webhookUrl,
          payment.paymentId,
          payment.amount,
          payment.transactionHash,
          payment.completedAt || new Date()
        );
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        paymentId: payment.paymentId,
        status: payment.status,
        amount: payment.amount,
        address: payment.address,
        transactionHash: payment.transactionHash,
        completedAt: payment.completedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

