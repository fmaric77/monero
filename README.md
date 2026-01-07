# Monero Payment Processor

A Next.js application for processing Monero payments with a custodial wallet system.

## Features

- Account registration with Monero public address
- Master custodial wallet with accounts per user (efficient and professional)
- Account assignment (managed by localhost app)
- Payment request creation and status tracking
- Balance management
- Webhook notifications for payment completion
- RESTful API with API key authentication

## Architecture

The system consists of two main components:

1. **Vercel App** (This repository): Next.js API that handles account management, payment tracking, and provides public APIs
2. **Localhost App (Mediator)**: Monero node that manages a master custodial wallet, assigns accounts to users, monitors blockchain, and pushes updates to Vercel

### Master Wallet Architecture

- **Single Master Wallet**: All users share one master custodial wallet file
- **Account-Based System**: Each user gets an account index (0, 1, 2, ...)
- **Subaddresses**: Each account can have multiple subaddresses for payments
- **Efficient**: One wallet refresh instead of N refreshes
- **Scalable**: Accounts are lightweight compared to individual wallets

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
- `GET /api/internal/users-without-account` - Get users needing account assignment
- `POST /api/internal/assign-account` - Assign account index to user

See `/docs` page for complete API documentation.

## Database Schema

### User Model
- `publicKey` - User's Monero public address (unique)
- `accountIndex` - System-assigned account index in master wallet (nullable, unique)
- `passwordHash` - Hashed password
- `apiKey` - API key for authentication (unique)
- `balance` - XMR balance in atomic units (calculated from transfers to user's subaddresses)
- `webhookUrl` - Optional webhook URL for notifications

### Payment Model
- `paymentId` - Unique payment identifier (UUID)
- `userId` - Reference to User
- `amount` - Payment amount in atomic units
- `address` - Monero subaddress (assigned by mediator, starts with '8')
- `status` - Payment status (pending/completed/expired/failed)
- `transactionHash` - Monero transaction hash (optional)
- `expiresAt` - Payment expiration timestamp

### How It Works

1. **User Registration**: User creates account with public key
2. **Account Assignment**: Mediator assigns next available account index (0, 1, 2, ...)
3. **Payment Creation**: User creates payment request
4. **Subaddress Generation**: Mediator generates unique subaddress for user's account
5. **Payment Monitoring**: Mediator monitors master wallet, filters transfers by account/subaddress
6. **Balance Calculation**: User balance calculated from transfers to their account's subaddresses

## Deployment

Deploy to Vercel:

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## Security Notes

- API keys are stored in plain text (consider hashing for production)
- Private keys for the master custodial wallet are NEVER stored in this app
- Master wallet is managed securely by the localhost mediator app
- All webhook URLs must use HTTPS
- Internal APIs are protected by shared secret
- Each user's funds are isolated by account index and subaddresses

## License

MIT

# monero
