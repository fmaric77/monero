/**
 * Webhook delivery utilities
 * Handles sending webhook notifications to user-configured URLs
 */

const WEBHOOK_TIMEOUT_MS = parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000', 10);
const WEBHOOK_RETRY_ATTEMPTS = parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3', 10);

export interface WebhookPayload {
  event: 'payment.completed';
  id: string; // Payment ID (consistent with API response)
  amount: number;
  transactionHash: string;
  completedAt: string;
}

/**
 * Send webhook with retry logic and exponential backoff
 */
export async function sendWebhook(
  url: string,
  payload: WebhookPayload
): Promise<{ success: boolean; error?: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < WEBHOOK_RETRY_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`Webhook delivered successfully to ${url} (attempt ${attempt + 1})`);
        return { success: true };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Webhook delivery attempt ${attempt + 1} failed:`, lastError.message);

      // Exponential backoff: wait 2^attempt seconds before retry
      if (attempt < WEBHOOK_RETRY_ATTEMPTS - 1) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error(`Webhook delivery failed after ${WEBHOOK_RETRY_ATTEMPTS} attempts to ${url}`);
  return {
    success: false,
    error: lastError?.message || 'Unknown error',
  };
}

/**
 * Deliver payment completion webhook (non-blocking)
 */
export async function deliverPaymentWebhook(
  webhookUrl: string,
  paymentId: string,
  amount: number,
  transactionHash: string,
  completedAt: Date
): Promise<void> {
  const payload: WebhookPayload = {
    event: 'payment.completed',
    id: paymentId, // Use 'id' for consistency with API response
    amount,
    transactionHash,
    completedAt: completedAt.toISOString(),
  };

  // Fire and forget - don't await to avoid blocking the request
  sendWebhook(webhookUrl, payload).catch((error) => {
    console.error('Webhook delivery error (non-blocking):', error);
  });
}

