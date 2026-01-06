import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireApiKey } from '@/lib/auth';
import User from '@/lib/models/User';
import { AccountResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/account
 * Get account information
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiKey(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    await dbConnect();

    const accountResponse: AccountResponse = {
      publicKey: user.publicKey,
      custodialAddress: user.custodialAddress || null,
      balance: user.balance,
      webhookUrl: user.webhookUrl,
      createdAt: user.createdAt.toISOString(),
    };

    return NextResponse.json(accountResponse);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account
 * Create or authenticate account (idempotent)
 * Always requires password. If account exists, verifies password and returns API key.
 * If account doesn't exist, creates it and returns API key.
 */
export async function POST(request: NextRequest) {
  let publicKey: string;
  let password: string;

  try {
    await dbConnect();

    const body = await request.json();
    publicKey = body.publicKey;
    password = body.password;

    if (!publicKey || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: publicKey and password', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ publicKey });

    if (existingUser) {
      // Account exists - verify password
      const { verifyPassword } = await import('@/lib/auth');
      const isValid = await verifyPassword(password, existingUser.passwordHash);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid password', code: 'INVALID_PASSWORD' },
          { status: 401 }
        );
      }

      // Return existing account credentials
      return NextResponse.json({
        apiKey: existingUser.apiKey,
        publicKey: existingUser.publicKey,
        custodialAddress: existingUser.custodialAddress || null,
      });
    }

    // Account doesn't exist - create new account
    const { hashPassword, generateApiKey } = await import('@/lib/auth');
    const passwordHash = await hashPassword(password);
    const apiKey = generateApiKey();

    const newUser = await User.create({
      publicKey,
      passwordHash,
      apiKey,
      balance: 0,
    });

    return NextResponse.json(
      {
        apiKey: newUser.apiKey,
        publicKey: newUser.publicKey,
        custodialAddress: newUser.custodialAddress || null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating/authenticating account:', error);
    
    if (error.code === 11000 && publicKey && password) {
      // Race condition: account was created between check and create
      // Try to authenticate instead
      try {
        const existingUser = await User.findOne({ publicKey });
        
        if (existingUser) {
          const { verifyPassword } = await import('@/lib/auth');
          const isValid = await verifyPassword(password, existingUser.passwordHash);
          
          if (isValid) {
            return NextResponse.json({
              apiKey: existingUser.apiKey,
              publicKey: existingUser.publicKey,
              custodialAddress: existingUser.custodialAddress || null,
            });
          }
        }
      } catch (retryError) {
        // Fall through to error response
      }
      
      return NextResponse.json(
        { error: 'Account already exists', code: 'DUPLICATE_ACCOUNT' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

