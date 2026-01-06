import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireApiKey } from '@/lib/auth';
import User from '@/lib/models/User';
import { webhookConfigSchema } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks
 * Configure webhook URL for payment notifications
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
    const validationResult = webhookConfigSchema.safeParse(body);

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

    const { url } = validationResult.data;

    // Update user's webhook URL
    user.webhookUrl = url;
    await user.save();

    return NextResponse.json({
      success: true,
      webhookUrl: user.webhookUrl,
    });
  } catch (error) {
    console.error('Error configuring webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

