import { z } from 'zod';

// API Request/Response Types
export interface CreatePaymentRequest {
  amount: number;
}

// Simplified payment response
export interface PaymentResponse {
  id: string; // paymentId (renamed for simplicity)
  status: 'pending' | 'completed' | 'expired' | 'failed';
  amount: number;
  address?: string; // Optional - subaddress tracked by mediator, can be fetched separately if needed
  expiresAt: string;
  // Optional fields only included when relevant
  transactionHash?: string;
  completedAt?: string;
}

export interface BalanceResponse {
  balance: number;
  currency: 'XMR';
}

export interface WebhookConfigRequest {
  url: string;
}

// Internal API Types
export interface PaymentUpdateRequest {
  paymentId: string;
  status: 'pending' | 'completed' | 'expired' | 'failed';
  transactionHash?: string;
  completedAt?: string;
}

export interface BalanceUpdateRequest {
  publicKey: string;
  balance: number;
}

export interface AssignAccountRequest {
  publicKey: string;      // User's external address (to identify user)
  accountIndex: number;   // Account index to assign
}

export interface UsersWithoutWalletResponse {
  users: Array<{
    id: string;
    publicKey: string;
    createdAt: string;
  }>;
}

export interface AccountResponse {
  publicKey: string;
  accountIndex: number | null;
  balance: number;
  webhookUrl?: string;
  createdAt: string;
}

// Zod Schemas for validation
export const createPaymentSchema = z.object({
  amount: z.number().positive().int()
});

export const webhookConfigSchema = z.object({
  url: z.string().url().refine(url => url.startsWith('https://'), {
    message: 'Webhook URL must use HTTPS'
  })
});

export const paymentUpdateSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(['pending', 'completed', 'expired', 'failed']),
  transactionHash: z.string().optional(),
  completedAt: z.string().optional(),
});

export const balanceUpdateSchema = z.object({
  publicKey: z.string().min(1),
  balance: z.number().nonnegative(),
});

export const assignAccountSchema = z.object({
  publicKey: z.string().min(1),
  accountIndex: z.number().int().nonnegative(),
});

export const paymentCreateSchema = z.object({
  paymentId: z.string().uuid(),
  userId: z.string().min(1),
  amount: z.number().positive().int(),
});

