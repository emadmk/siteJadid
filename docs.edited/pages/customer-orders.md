# Enhanced Orders Page

## Overview

The Enhanced Orders Page (`/orders`) displays a customer's complete order history with detailed information including order status, payment status, approval status (B2B), tracking information, and quick actions for each order.

**File Location:** `/home/user/siteJadid/src/app/orders/page.tsx`

**Route:** `/orders`

---

## Features List

1. **Order History Display** - All orders sorted by date (newest first)
2. **Order Status Tracking** - Visual status badges (Pending, Processing, Shipped, Delivered, Cancelled)
3. **Payment Status** - Payment state indicators (Pending, Paid, Failed, Refunded)
4. **B2B Approval Status** - Approval workflow status for B2B orders
5. **Tracking Information** - Shipping tracking numbers and carriers
6. **Order Preview** - First 3 items with images
7. **Quick Actions** - Reorder, Download Invoice, Cancel, Track Package, Leave Review
8. **Empty State** - "Browse Products" CTA when no orders exist

---

## Database Query

```typescript
async function getOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              images: true,
              sku: true,
            },
          },
        },
      },
      shipments: {
        select: {
          trackingNumber: true,
          carrier: true,
          status: true,
        },
      },
      approvals: {
        include: {
          approver: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      costCenter: {
        select: {
          name: true,
        },
      },
      createdByMember: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders;
}
```

---

## UI Components

### Order Card
```typescript
<div className={`bg-white rounded-lg border-2 ${statusColors[order.status].split(' ').pop()}`}>
  {/* Order Header */}
  <div className="p-6 border-b">
    <div className="flex items-center gap-3 mb-2">
      <h3 className="text-xl font-bold">{order.orderNumber}</h3>
      <span className={`px-3 py-1 rounded-full text-sm ${statusColors[order.status]}`}>
        {order.status}
      </span>
      <span className={`px-3 py-1 rounded-full text-sm ${paymentStatusColors[order.paymentStatus]}`}>
        {order.paymentStatus}
      </span>
      {order.approvals.length > 0 && (
        <span className="px-3 py-1 rounded-full text-sm">
          {order.approvals[0].status === 'PENDING' && '⏳ Pending Approval'}
          {order.approvals[0].status === 'APPROVED' && '✓ Approved'}
          {order.approvals[0].status === 'REJECTED' && '✗ Rejected'}
        </span>
      )}
    </div>
    <div className="text-sm text-gray-600">
      Placed on {new Date(order.createdAt).toLocaleDateString()}
      {order.costCenter && ` • Cost Center: ${order.costCenter.name}`}
      {order.createdByMember && ` • Created by: ${order.createdByMember.user.name}`}
    </div>
    {order.shipments.length > 0 && order.shipments[0].trackingNumber && (
      <div className="text-sm text-safety-green-600 mt-1">
        Tracking: {order.shipments[0].trackingNumber} ({order.shipments[0].carrier})
      </div>
    )}
  </div>

  {/* Order Items Preview */}
  <div className="p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {order.items.slice(0, 3).map((item) => (
        <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
          <div className="w-20 h-20 bg-white rounded">
            <img src={images[0]} alt={item.product.name} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium line-clamp-2">{item.product.name}</div>
            <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
            <div className="text-sm font-bold">${Number(item.price).toFixed(2)}</div>
          </div>
        </div>
      ))}
    </div>
    {order.items.length > 3 && (
      <div className="mt-3 text-sm text-gray-600">
        + {order.items.length - 3} more items
      </div>
    )}
  </div>

  {/* Actions */}
  <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap gap-3">
    {order.status === 'DELIVERED' && (
      <Button variant="outline" size="sm">Leave Review</Button>
    )}
    {order.status === 'SHIPPED' && order.shipments[0]?.trackingNumber && (
      <Button variant="outline" size="sm">Track Package</Button>
    )}
    {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
      <Button variant="outline" size="sm" className="border-red-500 text-red-500">Cancel Order</Button>
    )}
    <Button variant="outline" size="sm">Download Invoice</Button>
    <Button variant="outline" size="sm">Reorder</Button>
  </div>
</div>
```

### Status Colors
```typescript
const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-300',
  SHIPPED: 'bg-purple-100 text-purple-800 border-purple-300',
  DELIVERED: 'bg-safety-green-100 text-safety-green-800 border-safety-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
};

const paymentStatusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-safety-green-100 text-safety-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};
```

---

## Key Features

- **B2B Context**: Shows cost center, creator, and approval status
- **Tracking Integration**: Displays carrier and tracking number
- **Contextual Actions**: Actions change based on order status
- **Item Preview**: First 3 items with overflow indicator
- **Empty State**: Helpful CTA when no orders exist

---

## Future Enhancements

1. **Advanced Filtering** - By status, date range, payment status
2. **Search** - Search by order number or product
3. **Export** - Download order history as PDF/CSV
4. **Returns** - Initiate return/exchange from order page
