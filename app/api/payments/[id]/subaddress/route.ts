import { NextRequest, NextResponse } from 'next/server';
import { requireApiKey } from '@/lib/auth';
import Payment from '@/lib/models/Payment';
import dbConnect from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payments/:id/subaddress
 * Get subaddress for a payment by paymentId
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

    // Verify payment exists and belongs to user
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

    // Check if subaddress has been pushed by mediator
    if (payment.address) {
      return NextResponse.json({
        paymentId: payment.paymentId,
        subaddress: payment.address,
      });
    }

    // Subaddress not yet generated - mediator will push it within ~30 seconds
    return NextResponse.json(
      { 
        error: 'Subaddress not yet generated for this payment', 
        code: 'NOT_GENERATED',
        paymentId: params.id,
        message: 'Subaddress is generated asynchronously by the local mediator. Please check again in a few seconds (usually within ~30 seconds).'
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error fetching subaddress:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

