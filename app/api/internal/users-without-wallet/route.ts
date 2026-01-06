import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireInternalSecret } from '@/lib/auth';
import User from '@/lib/models/User';
import { UsersWithoutWalletResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/internal/users-without-wallet
 * Get list of users who don't have a custodial wallet assigned yet
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = requireInternalSecret(request);
    if (authCheck) {
      return authCheck;
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Find users without custodial address
    const users = await User.find({
      custodialAddress: { $exists: false },
    })
      .select('_id publicKey createdAt')
      .limit(limit)
      .sort({ createdAt: 1 })
      .lean();

    const response: UsersWithoutWalletResponse = {
      users: users.map((user) => ({
        id: user._id.toString(),
        publicKey: user.publicKey,
        createdAt: user.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching users without wallet:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

