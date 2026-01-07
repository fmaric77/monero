import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import dbConnect from '@/lib/db';
import { requireApiKey } from '@/lib/auth';
import Payment from '@/lib/models/Payment';
import { createPaymentSchema, PaymentResponse } from '@/types';

export const dynamic = 'force-dynamic';

const PAYMENT_EXPIRATION_HOURS = parseInt(
  process.env.PAYMENT_EXPIRATION_HOURS || '24',
  10
);

/**
 * POST /api/payments
 * Create payment request
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiKey(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    await dbConnect();

    const body = await request.json();
    const validationResult = createPaymentSchema.safeParse(body);

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

    const { amount } = validationResult.data;

    // Check if user has custodial address
    if (!user.custodialAddress) {
      return NextResponse.json(
        {
          error: 'Custodial wallet not yet assigned',
          code: 'NO_CUSTODIAL_WALLET',
        },
        { status: 400 }
      );
    }

    const paymentId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PAYMENT_EXPIRATION_HOURS);

    // Create payment record with custodial address (auto-populated from API key)
    // The mediator will replace this with a unique subaddress within ~30 seconds
    const payment = await Payment.create({
      paymentId,
      userId: user._id,
      amount,
      address: user.custodialAddress, // Auto-populated from user's custodial wallet
      status: 'pending',
      expiresAt,
    });

    // Simplified payment response
    // Note: Address is initially the custodial address. Mediator will replace it with 
    // a unique subaddress within ~30 seconds. User can poll GET /api/payments/:id 
    // to get the subaddress once assigned.
    const paymentResponse: PaymentResponse = {
      id: payment.paymentId,
      amount: payment.amount,
      address: payment.address, // Initially custodial address, then subaddress
      status: payment.status,
      expiresAt: payment.expiresAt.toISOString(),
    };

    return NextResponse.json(paymentResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

