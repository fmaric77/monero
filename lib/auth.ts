import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User, { IUser } from './models/User';
import dbConnect from './db';

/**
 * Validate API key from Authorization header
 * Returns the user if valid, null otherwise
 */
export async function validateApiKey(request: NextRequest): Promise<IUser | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.substring(7);
  
  if (!apiKey) {
    return null;
  }

  await dbConnect();
  
  // Find user by API key
  const user = await User.findOne({ apiKey });
  
  if (!user) {
    return null;
  }

  return user;
}

/**
 * Middleware to protect public API routes with API key authentication
 */
export async function requireApiKey(
  request: NextRequest
): Promise<{ user: IUser } | NextResponse> {
  const user = await validateApiKey(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'INVALID_API_KEY' },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Validate internal API secret from X-Internal-Secret header
 */
export function validateInternalSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-internal-secret');
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (!expectedSecret) {
    throw new Error('INTERNAL_API_SECRET environment variable is not set');
  }

  return secret === expectedSecret;
}

/**
 * Middleware to protect internal API routes with shared secret
 */
export function requireInternalSecret(request: NextRequest): NextResponse | null {
  if (!validateInternalSecret(request)) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'INVALID_INTERNAL_SECRET' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random API key
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

