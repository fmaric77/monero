import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireInternalSecret } from '@/lib/auth';
import User from '@/lib/models/User';
import { balanceUpdateSchema } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/internal/balance-update
 * Localhost app pushes balance updates
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = requireInternalSecret(request);
    if (authCheck) {
      return authCheck;
    }

    await dbConnect();

    const body = await request.json();
    const validationResult = balanceUpdateSchema.safeParse(body);

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

    const { publicKey, balance } = validationResult.data;

    const user = await User.findOne({ publicKey });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update balance atomically
    user.balance = balance;
    await user.save();

    return NextResponse.json({
      success: true,
      balance: user.balance,
    });
  } catch (error) {
    console.error('Error updating balance:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

