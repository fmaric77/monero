import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireInternalSecret } from '@/lib/auth';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';
import { paymentCreateSchema } from '@/types';

export const dynamic = 'force-dynamic';

const PAYMENT_EXPIRATION_HOURS = parseInt(
  process.env.PAYMENT_EXPIRATION_HOURS || '24',
  10
);

/**
 * POST /api/internal/payment-create
 * Localhost app creates payment with address (alternative flow)
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = requireInternalSecret(request);
    if (authCheck) {
      return authCheck;
    }

    await dbConnect();

    const body = await request.json();
    const validationResult = paymentCreateSchema.safeParse(body);

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

    const { paymentId, userId, amount } = validationResult.data;

    // Find user by publicKey
    const user = await User.findOne({ publicKey: userId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PAYMENT_EXPIRATION_HOURS);

    const payment = await Payment.create({
      paymentId,
      userId: user._id,
      amount,
      status: 'pending',
      expiresAt,
    });

    return NextResponse.json(
      {
        success: true,
        payment: {
          paymentId: payment.paymentId,
          status: payment.status,
          amount: payment.amount,
          expiresAt: payment.expiresAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating payment:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Payment ID already exists', code: 'DUPLICATE_PAYMENT' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

