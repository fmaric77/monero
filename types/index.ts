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
  address: string;
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
  address?: string;
}

export interface BalanceUpdateRequest {
  publicKey: string;
  balance: number;
}

export interface AssignCustodialWalletRequest {
  publicKey: string;      // User's external address (to identify user)
  custodialAddress: string; // New custodial wallet address to assign
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
  custodialAddress: string | null;
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
  address: z.string().optional(),
});

export const balanceUpdateSchema = z.object({
  publicKey: z.string().min(1),
  balance: z.number().nonnegative(),
});

export const assignCustodialWalletSchema = z.object({
  publicKey: z.string().min(1),
  custodialAddress: z.string().min(1),
});

export const paymentCreateSchema = z.object({
  paymentId: z.string().uuid(),
  userId: z.string().min(1),
  amount: z.number().positive().int(),
  address: z.string().min(1),
});

