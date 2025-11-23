# Addresses API Documentation

## Overview
The Addresses API allows authenticated users to manage their shipping and billing addresses. Supports CRUD operations with default address management.

**Base Path**: `/api/addresses`

---

## Endpoints

### 1. Get All User Addresses

**GET** `/api/addresses`

Returns all addresses for the authenticated user, sorted by default first, then by creation date.

#### Authentication
- ✅ Required
- Session must include valid user ID

#### Request
```http
GET /api/addresses HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
[
  {
    "id": "addr_abc123",
    "userId": "user_xyz789",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Acme Corp",
    "address1": "123 Main St",
    "address2": "Suite 100",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "United States",
    "phone": "+1-555-0123",
    "isDefault": true,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  {
    "id": "addr_def456",
    "userId": "user_xyz789",
    "firstName": "John",
    "lastName": "Doe",
    "company": null,
    "address1": "456 Oak Ave",
    "address2": null,
    "city": "Brooklyn",
    "state": "NY",
    "zipCode": "11201",
    "country": "United States",
    "phone": "+1-555-0124",
    "isDefault": false,
    "createdAt": "2025-01-14T09:20:00.000Z",
    "updatedAt": "2025-01-14T09:20:00.000Z"
  }
]
```

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch addresses"
}
```

---

### 2. Create New Address

**POST** `/api/addresses`

Creates a new address for the authenticated user.

#### Authentication
- ✅ Required

#### Request Body
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "company": "Tech Solutions Inc",
  "address1": "789 Broadway",
  "address2": "Floor 5",
  "city": "Manhattan",
  "state": "NY",
  "zipCode": "10003",
  "country": "United States",
  "phone": "+1-555-0125",
  "isDefault": false
}
```

#### Field Validation
| Field | Type | Required | Max Length | Notes |
|-------|------|----------|------------|-------|
| firstName | string | ✅ Yes | 100 | - |
| lastName | string | ✅ Yes | 100 | - |
| company | string | ❌ No | 200 | Optional |
| address1 | string | ✅ Yes | 255 | Street address |
| address2 | string | ❌ No | 255 | Apt, suite, etc. |
| city | string | ✅ Yes | 100 | - |
| state | string | ✅ Yes | 50 | State/Province |
| zipCode | string | ✅ Yes | 20 | Postal code |
| country | string | ✅ Yes | 100 | - |
| phone | string | ❌ No | 20 | Contact number |
| isDefault | boolean | ❌ No | - | Default: false |

#### Response (201 Created)
```json
{
  "id": "addr_new789",
  "userId": "user_xyz789",
  "firstName": "Jane",
  "lastName": "Smith",
  "company": "Tech Solutions Inc",
  "address1": "789 Broadway",
  "address2": "Floor 5",
  "city": "Manhattan",
  "state": "NY",
  "zipCode": "10003",
  "country": "United States",
  "phone": "+1-555-0125",
  "isDefault": false,
  "createdAt": "2025-01-16T14:25:00.000Z",
  "updatedAt": "2025-01-16T14:25:00.000Z"
}
```

#### Error Responses
```json
// 400 Bad Request - Missing required fields
{
  "error": "Missing required fields"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to create address"
}
```

#### Special Behavior
- If `isDefault` is set to `true`, all other addresses for the user will have `isDefault` set to `false`
- If this is the user's first address, it will automatically be set as default

---

### 3. Get Single Address

**GET** `/api/addresses/[addressId]`

Retrieves a specific address by ID. User can only access their own addresses.

#### Authentication
- ✅ Required

#### Request
```http
GET /api/addresses/addr_abc123 HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "id": "addr_abc123",
  "userId": "user_xyz789",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp",
  "address1": "123 Main St",
  "address2": "Suite 100",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "United States",
  "phone": "+1-555-0123",
  "isDefault": true,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 404 Not Found - Address doesn't exist or doesn't belong to user
{
  "error": "Address not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch address"
}
```

---

### 4. Update Address

**PATCH** `/api/addresses/[addressId]`

Updates an existing address. Only provided fields will be updated.

#### Authentication
- ✅ Required

#### Request Body (Partial Update)
```json
{
  "phone": "+1-555-9999",
  "isDefault": true
}
```

#### Updatable Fields
All fields from the creation endpoint can be updated individually.

#### Response (200 OK)
```json
{
  "id": "addr_abc123",
  "userId": "user_xyz789",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp",
  "address1": "123 Main St",
  "address2": "Suite 100",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "United States",
  "phone": "+1-555-9999",
  "isDefault": true,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-16T15:45:00.000Z"
}
```

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 404 Not Found
{
  "error": "Address not found"
}

// 500 Internal Server Error
{
  "error": "Failed to update address"
}
```

#### Special Behavior
- If `isDefault` is set to `true`, all other user addresses will have `isDefault` set to `false`
- Only the fields provided in the request body will be updated
- `updatedAt` timestamp is automatically updated

---

### 5. Delete Address

**DELETE** `/api/addresses/[addressId]`

Deletes an address. If the deleted address was the default, the most recently created remaining address will be set as default.

#### Authentication
- ✅ Required

#### Request
```http
DELETE /api/addresses/addr_abc123 HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "success": true
}
```

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 404 Not Found
{
  "error": "Address not found"
}

// 500 Internal Server Error
{
  "error": "Failed to delete address"
}
```

#### Special Behavior
- If the deleted address was the default (`isDefault: true`), the system automatically sets the most recently created remaining address as the new default
- If this was the user's last address, no new default is set

---

## Implementation Details

### File Location
- Main route: `src/app/api/addresses/route.ts`
- Dynamic route: `src/app/api/addresses/[addressId]/route.ts`

### Database Model
```prisma
model Address {
  id         String   @id @default(cuid())
  userId     String
  firstName  String
  lastName   String
  company    String?
  address1   String
  address2   String?
  city       String
  state      String
  zipCode    String
  country    String   @default("United States")
  phone      String?
  isDefault  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ordersAsShipping   Order[]  @relation("ShippingAddress")
  ordersAsBilling    Order[]  @relation("BillingAddress")

  @@index([userId])
  @@index([userId, isDefault])
}
```

### Security Features
- User can only access their own addresses (enforced by `userId` filter)
- Session validation on every request
- Automatic cleanup on user deletion (Cascade)

### Performance Optimizations
- Indexed by `userId` for fast lookup
- Composite index on `userId` + `isDefault` for default address queries
- Ordered by default first, then creation date

---

## Usage Examples

### JavaScript/TypeScript (fetch)
```typescript
// Get all addresses
const addresses = await fetch('/api/addresses', {
  credentials: 'include'
});
const data = await addresses.json();

// Create address
const newAddress = await fetch('/api/addresses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    address1: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    isDefault: true
  })
});

// Update address
const updated = await fetch('/api/addresses/addr_123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    phone: '+1-555-1234',
    isDefault: true
  })
});

// Delete address
await fetch('/api/addresses/addr_123', {
  method: 'DELETE',
  credentials: 'include'
});
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

function useAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/addresses', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setAddresses(data);
        setLoading(false);
      });
  }, []);

  const createAddress = async (addressData) => {
    const res = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(addressData)
    });
    const newAddress = await res.json();
    setAddresses([...addresses, newAddress]);
    return newAddress;
  };

  return { addresses, loading, createAddress };
}
```

---

## Related Documentation
- [Orders API](./orders.md) - Uses addresses for shipping/billing
- [Checkout Page](../pages/customer-checkout.md) - Address selection UI
- [Profile Page](../pages/customer-profile.md) - Address management UI
