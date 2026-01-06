import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireInternalSecret } from '@/lib/auth';
import User from '@/lib/models/User';
import { assignCustodialWalletSchema } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/internal/assign-custodial-wallet
 * Assign a custodial wallet address to a user
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = requireInternalSecret(request);
    if (authCheck) {
      return authCheck;
    }

    await dbConnect();

    const body = await request.json();
    const validationResult = assignCustodialWalletSchema.safeParse(body);

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

    const { publicKey, custodialAddress } = validationResult.data;

    const user = await User.findOne({ publicKey });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (user.custodialAddress) {
      return NextResponse.json(
        {
          error: 'User already has a custodial address assigned',
          code: 'ALREADY_ASSIGNED',
        },
        { status: 400 }
      );
    }

    // Check if custodial address is already assigned to another user
    const existingUser = await User.findOne({ custodialAddress });
    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Custodial address already assigned to another user',
          code: 'DUPLICATE_CUSTODIAL_ADDRESS',
        },
        { status: 409 }
      );
    }

    // Assign custodial address
    user.custodialAddress = custodialAddress;
    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        publicKey: user.publicKey,
        custodialAddress: user.custodialAddress,
      },
    });
  } catch (error: any) {
    console.error('Error assigning custodial wallet:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          error: 'Custodial address already assigned',
          code: 'DUPLICATE_CUSTODIAL_ADDRESS',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

