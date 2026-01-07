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

    // Simplified payment response - only include optional fields when they exist
    // Only return address if it's a subaddress (starts with '8')
    // Don't return main address (starts with '4') - user should wait for subaddress
    const paymentResponse: PaymentResponse = {
      id: payment.paymentId,
      status: payment.status,
      amount: payment.amount,
      address: payment.address.startsWith('8') ? payment.address : '', // Only return subaddress, not main address
      expiresAt: payment.expiresAt.toISOString(),
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

