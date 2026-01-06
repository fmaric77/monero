import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  code?: string,
  status: number = 400
): Response {
  return Response.json(
    { error, code },
    { status }
  );
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T, status: number = 200): Response {
  return Response.json(data, { status });
}

