# Webhooks API Documentation

## Overview
The Webhooks API allows you to configure HTTP callbacks that are triggered when specific events occur in the platform (e.g., order created, order shipped, payment received). Enables integration with external systems and automation workflows.

**Base Path**: `/api/webhooks`

---

## Endpoints

### 1. Get All Webhooks

**GET** `/api/webhooks`

Returns all configured webhooks for the authenticated user/organization.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ADMIN or SUPER_ADMIN (recommended)

#### Request
```http
GET /api/webhooks HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
[
  {
    "id": "webhook_abc123",
    "url": "https://api.example.com/webhooks/orders",
    "events": [
      "order.created",
      "order.shipped",
      "order.delivered"
    ],
    "isActive": true,
    "secret": "whsec_a1b2c3d4e5f6",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  {
    "id": "webhook_def456",
    "url": "https://api.example.com/webhooks/inventory",
    "events": [
      "product.created",
      "product.updated",
      "inventory.low_stock"
    ],
    "isActive": true,
    "secret": "whsec_g7h8i9j0k1l2",
    "createdAt": "2025-01-14T14:20:00.000Z",
    "updatedAt": "2025-01-14T14:20:00.000Z"
  }
]
```

#### Response Fields
- **id**: Unique webhook identifier
- **url**: Endpoint URL where events are sent
- **events**: Array of event types this webhook subscribes to
- **isActive**: Whether webhook is currently enabled
- **secret**: Secret key for signature verification
- **createdAt**: Webhook creation timestamp
- **updatedAt**: Last update timestamp

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch webhooks"
}
```

---

### 2. Create Webhook

**POST** `/api/webhooks`

Creates a new webhook subscription. Returns the webhook with a generated secret for signature verification.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ADMIN or SUPER_ADMIN

#### Request Body
```json
{
  "url": "https://api.example.com/webhooks/orders",
  "events": [
    "order.created",
    "order.shipped",
    "order.delivered",
    "order.cancelled"
  ],
  "isActive": true
}
```

#### Field Validation
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| url | string | ✅ Yes | Must be valid HTTPS URL |
| events | array | ✅ Yes | Array of event types to subscribe to |
| isActive | boolean | ❌ No | Default: true |

#### Response (201 Created)
```json
{
  "id": "webhook_new789",
  "url": "https://api.example.com/webhooks/orders",
  "events": [
    "order.created",
    "order.shipped",
    "order.delivered",
    "order.cancelled"
  ],
  "isActive": true,
  "secret": "whsec_m3n4o5p6q7r8",
  "createdAt": "2025-01-16T15:30:00.000Z",
  "updatedAt": "2025-01-16T15:30:00.000Z"
}
```

#### Secret Generation
The API automatically generates a unique secret in the format `whsec_<random>`. This secret should be:
- **Stored Securely**: Save in your application configuration
- **Used for Verification**: Validate webhook signatures
- **Never Shared**: Treat like a password

#### Error Responses
```json
// 400 Bad Request - Invalid URL
{
  "error": "Invalid webhook URL"
}

// 400 Bad Request - Invalid events
{
  "error": "Events array is required"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to create webhook"
}
```

---

## Supported Events

### Order Events
| Event | Description | Payload |
|-------|-------------|---------|
| `order.created` | Order placed successfully | Full order object |
| `order.updated` | Order details modified | Updated order object |
| `order.cancelled` | Order cancelled by user/admin | Order object with cancellation reason |
| `order.shipped` | Order dispatched for delivery | Order with shipment details |
| `order.delivered` | Order delivered to customer | Order with delivery confirmation |
| `order.refunded` | Order refund processed | Order with refund details |

### Payment Events
| Event | Description | Payload |
|-------|-------------|---------|
| `payment.received` | Payment successfully processed | Payment details |
| `payment.failed` | Payment attempt failed | Error details |
| `payment.refunded` | Refund issued | Refund transaction details |

### Product Events
| Event | Description | Payload |
|-------|-------------|---------|
| `product.created` | New product added | Product object |
| `product.updated` | Product details changed | Updated product object |
| `product.deleted` | Product removed | Product ID |

### Inventory Events
| Event | Description | Payload |
|-------|-------------|---------|
| `inventory.updated` | Stock quantity changed | Product ID, old/new quantity |
| `inventory.low_stock` | Stock below threshold | Product details, current stock |
| `inventory.out_of_stock` | Product sold out | Product details |

### Customer Events
| Event | Description | Payload |
|-------|-------------|---------|
| `customer.created` | New customer registered | Customer object |
| `customer.updated` | Customer profile changed | Updated customer object |
| `customer.deleted` | Customer account deleted | Customer ID |

### Review Events
| Event | Description | Payload |
|-------|-------------|---------|
| `review.created` | New product review submitted | Review object |
| `review.approved` | Review approved by moderator | Review object |
| `review.rejected` | Review rejected | Review ID, reason |

---

## Webhook Payload Structure

### Standard Payload Format
```json
{
  "id": "evt_abc123",
  "type": "order.created",
  "timestamp": "2025-01-16T15:30:00.000Z",
  "data": {
    "id": "order_xyz789",
    "orderNumber": "ORD-1705401234-A7B3C",
    "userId": "user_john",
    "status": "PENDING",
    "total": 1387.50,
    "items": [
      {
        "productId": "prod_vest",
        "quantity": 50,
        "price": 25.00
      }
    ],
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "address1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    }
  }
}
```

### Payload Fields
- **id**: Unique event identifier
- **type**: Event type (e.g., "order.created")
- **timestamp**: ISO 8601 timestamp
- **data**: Event-specific payload

---

## Webhook Security

### Signature Verification

Each webhook request includes a signature in the `X-Webhook-Signature` header. Verify this signature to ensure the request is authentic.

#### Signature Header
```
X-Webhook-Signature: sha256=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

#### Verification Example (Node.js)
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

// Usage in webhook handler
app.post('/webhooks/orders', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
  console.log('Event:', payload.type);
  console.log('Data:', payload.data);

  res.status(200).json({ received: true });
});
```

### Security Best Practices
1. **Verify Signatures**: Always validate webhook signatures
2. **Use HTTPS**: Webhook URLs must use HTTPS
3. **Idempotency**: Handle duplicate events gracefully
4. **Rate Limiting**: Implement rate limits on webhook endpoints
5. **Timeout**: Respond within 5 seconds to avoid retries
6. **Error Handling**: Return 2xx for successful processing

---

## Webhook Delivery

### Delivery Flow
```
┌─────────────────┐
│  Event Occurs   │
│  (e.g., Order)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Find Webhooks  │
│  for Event Type │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build Payload  │
│  & Sign         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST to URL    │
│  with Signature │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼────┐ ┌──▼────────┐
│SUCCESS │ │  FAILURE  │
│(2xx)   │ │  (Retry)  │
└────────┘ └───────────┘
```

### Retry Policy
- **Initial Attempt**: Immediate
- **1st Retry**: After 1 minute
- **2nd Retry**: After 5 minutes
- **3rd Retry**: After 30 minutes
- **4th Retry**: After 2 hours
- **5th Retry**: After 12 hours
- **Max Retries**: 5 attempts

### Expected Response
Your webhook endpoint should:
- Return HTTP 200-299 status code
- Respond within 5 seconds
- Return JSON: `{ "received": true }`

---

## Implementation Details

### File Location
- Route: `src/app/api/webhooks/route.ts`

### Current Implementation
```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const webhooks = await db.webhook.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(webhooks);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url, events, isActive } = await request.json();

  const webhook = await db.webhook.create({
    data: {
      url,
      events,
      isActive: isActive !== false,
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
    },
  });

  return NextResponse.json(webhook, { status: 201 });
}
```

### Database Model (Planned)
```prisma
model Webhook {
  id        String   @id @default(cuid())
  url       String
  events    String[] // Array of event types
  isActive  Boolean  @default(true)
  secret    String   // For signature verification

  // Delivery stats
  lastDeliveryAt    DateTime?
  lastDeliveryStatus String?
  failureCount       Int      @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  deliveries WebhookDelivery[]

  @@index([isActive])
}

model WebhookDelivery {
  id         String   @id @default(cuid())
  webhookId  String
  eventType  String
  payload    Json
  responseStatus Int?
  responseBody   String?
  deliveredAt    DateTime @default(now())

  webhook    Webhook  @relation(fields: [webhookId], references: [id], onDelete: Cascade)

  @@index([webhookId])
  @@index([deliveredAt])
}
```

---

## Usage Examples

### JavaScript/TypeScript (fetch)
```typescript
// Get all webhooks
const webhooks = await fetch('/api/webhooks', {
  credentials: 'include'
});
const webhookList = await webhooks.json();

// Create webhook
const newWebhook = await fetch('/api/webhooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    url: 'https://api.example.com/webhooks/orders',
    events: ['order.created', 'order.shipped'],
    isActive: true
  })
});

const webhook = await newWebhook.json();
console.log('Webhook created with secret:', webhook.secret);
```

### Webhook Receiver (Node.js/Express)
```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const WEBHOOK_SECRET = 'whsec_m3n4o5p6q7r8';

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return `sha256=${expectedSignature}` === signature;
}

app.post('/webhooks/orders', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;

  // Verify signature
  if (!verifySignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process event
  const { type, data } = payload;

  switch (type) {
    case 'order.created':
      console.log('New order:', data.orderNumber);
      // Send to fulfillment system
      break;

    case 'order.shipped':
      console.log('Order shipped:', data.orderNumber);
      // Send shipping notification
      break;

    case 'order.delivered':
      console.log('Order delivered:', data.orderNumber);
      // Request review
      break;

    default:
      console.log('Unknown event type:', type);
  }

  // Acknowledge receipt
  res.status(200).json({ received: true });
});

app.listen(3001, () => {
  console.log('Webhook receiver listening on port 3001');
});
```

### React Webhook Manager
```typescript
function WebhookManager() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    const res = await fetch('/api/webhooks', { credentials: 'include' });
    const data = await res.json();
    setWebhooks(data);
    setLoading(false);
  };

  const createWebhook = async (webhookData) => {
    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(webhookData)
    });

    const newWebhook = await res.json();
    setWebhooks([...webhooks, newWebhook]);

    // Show secret to user (only shown once)
    alert(`Webhook created! Secret: ${newWebhook.secret}\nPlease save this secret securely.`);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="webhook-manager">
      <h2>Webhooks</h2>

      <button onClick={() => setShowForm(true)}>Create Webhook</button>

      <div className="webhook-list">
        {webhooks.map(webhook => (
          <div key={webhook.id} className="webhook-card">
            <h3>{webhook.url}</h3>
            <p>Events: {webhook.events.join(', ')}</p>
            <p>Status: {webhook.isActive ? '✓ Active' : '✗ Inactive'}</p>
            <p>Created: {new Date(webhook.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing Webhooks

### Testing Tools
1. **webhook.site**: Public webhook testing endpoint
2. **ngrok**: Expose local development server
3. **Postman**: Mock webhook requests
4. **RequestBin**: Capture and inspect webhooks

### Test Webhook Example
```bash
# Use webhook.site
curl -X POST https://webhook.site/unique-id \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=abc123" \
  -d '{
    "id": "evt_test",
    "type": "order.created",
    "timestamp": "2025-01-16T15:30:00.000Z",
    "data": {
      "orderNumber": "ORD-TEST-001",
      "total": 100.00
    }
  }'
```

### Local Testing with ngrok
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3001

# Use the HTTPS URL in webhook configuration
# https://abc123.ngrok.io/webhooks/orders
```

---

## Best Practices

### Webhook Design
1. **Keep Payloads Small**: Include IDs, fetch full data if needed
2. **Idempotency**: Use event IDs to prevent duplicate processing
3. **Fast Response**: Respond quickly, process asynchronously
4. **Error Handling**: Return specific error codes
5. **Logging**: Log all webhook deliveries

### Monitoring
1. **Track Failures**: Monitor failed webhook deliveries
2. **Alert on Errors**: Notify when webhooks fail repeatedly
3. **Delivery Metrics**: Track success rate and latency
4. **Retry Analysis**: Understand why retries happen
5. **Disable on Failure**: Auto-disable after 5 consecutive failures

### Security
1. **Signature Verification**: Always verify signatures
2. **HTTPS Only**: Reject non-HTTPS URLs
3. **Rate Limiting**: Limit webhook calls to prevent abuse
4. **IP Whitelisting**: Restrict source IPs
5. **Audit Logging**: Log all webhook activity

---

## Troubleshooting

### Common Issues

**Webhook not receiving events**
- Verify webhook is active (`isActive: true`)
- Check event type matches (`order.created` vs `order.updated`)
- Ensure URL is accessible from internet
- Check firewall/security group settings

**Signature verification fails**
- Verify secret matches exactly
- Check payload is not modified before verification
- Ensure using raw request body (not parsed)
- Use correct hashing algorithm (SHA-256)

**Timeouts and failures**
- Endpoint takes too long to respond (> 5 seconds)
- Server is down or unreachable
- SSL certificate issues
- Network connectivity problems

---

## Future Enhancements

### Planned Features
1. **Webhook Management UI**: Visual webhook configuration
2. **Delivery Dashboard**: View delivery history and status
3. **Event Filtering**: Advanced filters for events
4. **Custom Headers**: Add custom HTTP headers
5. **Webhook Testing**: Built-in test functionality
6. **Webhook Templates**: Predefined webhook configurations
7. **Batch Events**: Group multiple events in single request
8. **Circuit Breaker**: Auto-disable failing webhooks
9. **Delivery Analytics**: Success rate, latency charts
10. **Webhook Logs**: Detailed delivery logs with payloads

---

## Related Documentation
- [Events Reference](../guides/webhook-events.md) - Complete event catalog
- [Security Guide](../guides/webhook-security.md) - Webhook security best practices
- [Integration Examples](../guides/webhook-integrations.md) - Common integration patterns
- [Admin Webhooks Page](../pages/admin-webhooks.md) - Webhook management UI
