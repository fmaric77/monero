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
    
    // Connect to database and verify connection
    try {
      const db = await dbConnect();
      console.log(`Database connection status: ${db.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
      if (db.connection.readyState !== 1) {
        console.error(`Database not connected! ReadyState: ${db.connection.readyState}`);
        return NextResponse.json(
          { error: 'Database connection failed', code: 'DB_CONNECTION_ERROR' },
          { status: 500 }
        );
      }
    } catch (dbError: any) {
      console.error('Database connection error:', dbError.message);
      return NextResponse.json(
        { error: 'Database connection failed', code: 'DB_CONNECTION_ERROR', details: dbError.message },
        { status: 500 }
      );
    }

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

    // Check if user has account index
    if (user.accountIndex === undefined || user.accountIndex === null) {
      return NextResponse.json(
        {
          error: 'Account not yet assigned',
          code: 'NO_ACCOUNT',
        },
        { status: 400 }
      );
    }

    const paymentId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PAYMENT_EXPIRATION_HOURS);

    // Create payment record (subaddress will be assigned by mediator and tracked separately)
    // The mediator will assign a unique subaddress within ~30 seconds
    console.log(`Creating payment: paymentId=${paymentId}, userId=${user._id}, amount=${amount}, accountIndex=${user.accountIndex}`);
    
    let payment;
    try {
      payment = await Payment.create({
        paymentId,
        userId: user._id,
        amount,
        status: 'pending',
        expiresAt,
      });
      console.log(`✅ Payment created successfully: ${payment.paymentId}`);
    } catch (createError: any) {
      console.error('❌ Payment.create() failed:', {
        error: createError.message,
        code: createError.code,
        name: createError.name,
        stack: createError.stack,
        paymentId,
        userId: user._id,
        amount,
        accountIndex: user.accountIndex,
      });
      
      // Check for duplicate key error
      if (createError.code === 11000) {
        return NextResponse.json(
          { error: 'Payment ID already exists', code: 'DUPLICATE_PAYMENT' },
          { status: 409 }
        );
      }
      
      // Re-throw to be caught by outer catch
      throw createError;
    }

    // Verify payment was actually saved
    const verifyPayment = await Payment.findOne({ paymentId });
    if (!verifyPayment) {
      console.error('❌ Payment was not saved to database after create()');
      return NextResponse.json(
        { error: 'Payment creation failed - record not found in database', code: 'SAVE_FAILED' },
        { status: 500 }
      );
    }

    // Payment response - subaddress is tracked by mediator separately, linked by paymentId
    // Can be fetched from mediator API if needed
    const paymentResponse: PaymentResponse = {
      id: payment.paymentId,
      amount: payment.amount,
      status: payment.status,
      expiresAt: payment.expiresAt.toISOString(),
    };

    return NextResponse.json(paymentResponse, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating payment:', {
      error: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

