import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireApiKey } from '@/lib/auth';
import User from '@/lib/models/User';
import { BalanceResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/balance
 * Get account balance
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiKey(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    await dbConnect();

    // Refresh user data from database to get latest balance
    const refreshedUser = await User.findById(user._id);
    if (!refreshedUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const balanceResponse: BalanceResponse = {
      balance: refreshedUser.balance || 0,
      currency: 'XMR',
    };

    return NextResponse.json(balanceResponse);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

