# Client App Integration Flow

## Payment Creation Flow

### Step 1: Create Payment

**Request:**
```bash
POST https://your-app.vercel.app/api/payments
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "amount": 1500000000  // Amount in atomic units (1.5 XMR)
}
```

**Response (201 Created):**
```json
{
  "id": "8a61c863-f548-49e1-9c32-734f04202af8",  // ← This is the paymentId!
  "amount": 1500000000,
  "status": "pending",
  "address": "8xxxxx...",  // ← Subaddress (if generated immediately)
  "expiresAt": "2024-01-08T12:00:00.000Z"
}
```

### Step 2: Display Subaddress

The `address` field in the response contains the subaddress. **Use the `id` field as the paymentId** for any subsequent requests.

**If `address` is missing** (mediator unavailable), fetch it:

```bash
GET https://your-app.vercel.app/api/payments/8a61c863-f548-49e1-9c32-734f04202af8/subaddress
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "paymentId": "8a61c863-f548-49e1-9c32-734f04202af8",
  "subaddress": "8xxxxx...",
  "subaddressIndex": 0,
  "accountIndex": 1
}
```

### Step 3: Check Payment Status

```bash
GET https://your-app.vercel.app/api/payments/8a61c863-f548-49e1-9c32-734f04202af8
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "id": "8a61c863-f548-49e1-9c32-734f04202af8",
  "amount": 1500000000,
  "status": "completed",  // pending | completed | expired | failed
  "address": "8xxxxx...",
  "expiresAt": "2024-01-08T12:00:00.000Z",
  "transactionHash": "abc123...",
  "completedAt": "2024-01-08T11:30:00.000Z"
}
```

## Complete Client Flow Example

```javascript
// 1. Create payment
const createPayment = async (amount) => {
  const response = await fetch('https://your-app.vercel.app/api/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });
  
  const payment = await response.json();
  
  // payment.id is the paymentId - use this for all subsequent requests
  // payment.address is the subaddress (if available)
  
  return payment;
};

// 2. Get subaddress if not in initial response
const getSubaddress = async (paymentId) => {
  const response = await fetch(
    `https://your-app.vercel.app/api/payments/${paymentId}/subaddress`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  );
  
  const data = await response.json();
  return data.subaddress;
};

// 3. Usage
const payment = await createPayment(1500000000);
const subaddress = payment.address || await getSubaddress(payment.id);

// Display subaddress to user
console.log(`Send ${payment.amount / 1e12} XMR to: ${subaddress}`);
```

## Key Points

1. **Payment ID**: The `id` field in the payment response IS the `paymentId` - use it for all subsequent API calls
2. **Subaddress**: Usually returned immediately in the `address` field when creating payment
3. **Fallback**: If `address` is missing, use `GET /api/payments/:id/subaddress` to fetch it
4. **Status Check**: Use `GET /api/payments/:id` to check payment status (includes subaddress if available)

