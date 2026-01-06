# Monero Payment Processor

A Next.js application for processing Monero payments with a custodial wallet system.

## Features

- Account registration with Monero public address
- Custodial wallet assignment (managed by localhost app)
- Payment request creation and status tracking
- Balance management
- Webhook notifications for payment completion
- RESTful API with API key authentication

## Architecture

The system consists of two main components:

1. **Vercel App** (This repository): Next.js API that handles account management, payment tracking, and provides public APIs
2. **Localhost App**: Monero node that generates custodial wallets, monitors blockchain, and pushes updates to Vercel

## Setup

### Prerequisites

- Node.js 18+ 
- MongoDB database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```env
   MONGODB_URI=your-mongodb-connection-string
   INTERNAL_API_SECRET=your-shared-secret-for-localhost-app
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   PAYMENT_EXPIRATION_HOURS=24
   WEBHOOK_TIMEOUT_MS=5000
   WEBHOOK_RETRY_ATTEMPTS=3
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Public APIs (Require API Key)

- `POST /api/payments` - Create payment request
- `GET /api/payments/:id` - Check payment status
- `GET /api/balance` - Get account balance
- `GET /api/account` - Get account information
- `POST /api/webhooks` - Configure webhook URL

### Internal APIs (Require Shared Secret)

- `POST /api/internal/payment-update` - Update payment status
- `POST /api/internal/balance-update` - Update user balance
- `POST /api/internal/payment-create` - Create payment with address
- `GET /api/internal/users-without-wallet` - Get users needing custodial wallets
- `POST /api/internal/assign-custodial-wallet` - Assign custodial wallet to user

See `/docs` page for complete API documentation.

## Database Schema

### User Model
- `publicKey` - User's Monero public address (unique)
- `custodialAddress` - System-assigned custodial wallet address (nullable)
- `passwordHash` - Hashed password
- `apiKey` - API key for authentication (unique)
- `balance` - XMR balance in atomic units
- `webhookUrl` - Optional webhook URL for notifications

### Payment Model
- `paymentId` - Unique payment identifier (UUID)
- `userId` - Reference to User
- `amount` - Payment amount in atomic units
- `address` - Monero payment address
- `status` - Payment status (pending/completed/expired/failed)
- `transactionHash` - Monero transaction hash (optional)
- `expiresAt` - Payment expiration timestamp

## Deployment

Deploy to Vercel:

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## Security Notes

- API keys are stored in plain text (consider hashing for production)
- Private keys for custodial wallets are NEVER stored in this app
- All webhook URLs must use HTTPS
- Internal APIs are protected by shared secret

## License

MIT

