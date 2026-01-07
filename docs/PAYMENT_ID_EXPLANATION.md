# Payment ID Explanation

## Each Payment Has Its Own Unique ID

When you create a payment, you get back a **unique payment ID** that identifies **that specific payment**. You use **this same ID** for all operations related to **that one payment**.

## Example Flow

### Payment 1: User wants to pay 1.5 XMR

```javascript
// Create Payment 1
const payment1 = await createPayment(1500000000);
// Response:
// {
//   "id": "abc-123-def-456",  // ← Unique ID for Payment 1
//   "amount": 1500000000,
//   "address": "8xxxxx..."
// }

// Use Payment 1's ID for all operations on Payment 1:
GET /api/payments/abc-123-def-456              // Check status of Payment 1
GET /api/payments/abc-123-def-456/subaddress   // Get subaddress for Payment 1
```

### Payment 2: Same user wants to pay 2.0 XMR (different payment)

```javascript
// Create Payment 2 (different payment, different ID)
const payment2 = await createPayment(2000000000);
// Response:
// {
//   "id": "xyz-789-uvw-012",  // ← Different unique ID for Payment 2
//   "amount": 2000000000,
//   "address": "8yyyyy..."
// }

// Use Payment 2's ID for all operations on Payment 2:
GET /api/payments/xyz-789-uvw-012              // Check status of Payment 2
GET /api/payments/xyz-789-uvw-012/subaddress   // Get subaddress for Payment 2
```

## Why Use the Same ID?

The payment ID is like a **reference number** or **transaction ID**:

- **Payment 1** → ID: `abc-123-def-456` → Use this ID for all Payment 1 operations
- **Payment 2** → ID: `xyz-789-uvw-012` → Use this ID for all Payment 2 operations
- **Payment 3** → ID: `mno-345-pqr-678` → Use this ID for all Payment 3 operations

## Real-World Analogy

Think of it like a **receipt number**:
- You buy something → Get receipt #12345
- You use receipt #12345 to:
  - Check order status
  - Get tracking info
  - Request refund
  - All operations for THAT purchase

- You buy something else → Get receipt #67890 (different number)
- You use receipt #67890 for operations on THAT purchase

## Complete Example

```javascript
// User creates 3 different payments
const payment1 = await createPayment(1000000000);  // ID: "pay-001"
const payment2 = await createPayment(2000000000);  // ID: "pay-002"  
const payment3 = await createPayment(3000000000);  // ID: "pay-003"

// Each payment has its own ID - use the correct one for each payment:

// Check status of Payment 1
await checkStatus("pay-001");  // ✅ Correct

// Get subaddress for Payment 2
await getSubaddress("pay-002");  // ✅ Correct

// Check status of Payment 3
await checkStatus("pay-003");  // ✅ Correct

// Wrong - using Payment 1's ID to check Payment 2's status
await checkStatus("pay-001");  // ❌ Wrong - this checks Payment 1, not Payment 2
```

## Summary

- **Each payment** gets a **unique payment ID**
- Use **that payment's ID** for all operations on **that specific payment**
- Different payments have different IDs
- Don't mix up IDs between different payments

