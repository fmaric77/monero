import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireApiKey } from '@/lib/auth';
import Payment from '@/lib/models/Payment';
import { PaymentResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payments/:id
 * Check payment status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiKey(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    await dbConnect();

    const payment = await Payment.findOne({
      paymentId: params.id,
      userId: user._id,
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Subaddress is stored in mediator's local MongoDB and cannot be fetched directly
    // It will be included in the response once the mediator has processed the payment
    // For now, return payment without subaddress - client should use GET /api/payments/:id/subaddress
    // which will return a helpful error message directing them to check payment status
    
    // Payment response - subaddress not available via direct fetch (mediator is local)
    const paymentResponse: PaymentResponse = {
      id: payment.paymentId,
      status: payment.status,
      amount: payment.amount,
      expiresAt: payment.expiresAt.toISOString(),
      // address will be null - subaddress is in mediator's local DB
    };

    // Only include optional fields if they exist
    if (payment.transactionHash) {
      paymentResponse.transactionHash = payment.transactionHash;
    }
    if (payment.completedAt) {
      paymentResponse.completedAt = payment.completedAt.toISOString();
    }

    return NextResponse.json(paymentResponse);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

