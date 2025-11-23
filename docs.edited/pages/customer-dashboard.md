# Enhanced Customer Dashboard Page

## Overview

The Enhanced Customer Dashboard (`/dashboard`) is the central hub for all customer activities in the e-commerce platform. This page provides a personalized overview of orders, account information, quick actions, and B2B-specific features for business customers. It adapts its display based on the user's account type (B2C, B2B, or GSA).

**File Location:** `/home/user/siteJadid/src/app/dashboard/page.tsx`

**Route:** `/dashboard`

---

## User Access Requirements

### Authorized Users
- All authenticated customers (B2C, B2B, GSA)
- Excludes ADMIN and SUPER_ADMIN users (they are redirected to `/admin`)

### Authentication Check
```typescript
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  redirect('/auth/signin?callbackUrl=/dashboard');
}

if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
  redirect('/admin');
}
```

---

## Features List

### Core Features
1. **Personalized Welcome Header**
   - User name greeting
   - Account type display (B2C/B2B/GSA)
   - Member since date
   - Loyalty points (if enrolled)

2. **B2B Membership Banner** (B2B accounts only)
   - Company name display
   - User role within company
   - Department and cost center info
   - Order limit display
   - Link to team management

3. **Quick Statistics Cards (4 Cards)**
   - Total orders count
   - Active orders (pending + processing)
   - Pending approvals (for APPROVER/ADMIN) OR shipped orders
   - Shopping lists count (clickable)

4. **Recent Orders List**
   - Last 5 orders with details
   - Order number, status, payment status
   - Order date and total amount
   - Quick link to order details
   - Empty state with "Browse Products" CTA

5. **Quick Actions Sidebar**
   - Shop Products
   - Quick Order Pad
   - Bulk Order Entry
   - View Orders
   - Manage Addresses

6. **Saved Addresses Widget**
   - Display up to 2 saved addresses
   - Show default address badge
   - Link to address management
   - Empty state message

7. **Account Type Badge** (B2B/GSA only)
   - Special account benefits display
   - Contact account manager CTA

### Enhanced B2B Features
- Company information display
- Role and permissions visibility
- Cost center budget tracking
- Pending approvals counter (for approvers)
- Team management access

---

## Database Queries Used

### 1. Get Complete Dashboard Data
```typescript
async function getDashboardData(userId: string) {
  const [user, orders, addresses, loyaltyProfile, b2bMembership, shoppingLists] =
    await Promise.all([
      // User profile
      db.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          accountType: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      }),
      // Recent orders
      db.order.findMany({
        where: { userId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
          items: {
            select: {
              product: {
                select: {
                  name: true,
                  images: true,
                },
              },
            },
          },
          approvals: {
            select: {
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Saved addresses
      db.address.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' },
        take: 3,
      }),
      // Loyalty profile
      db.loyaltyProfile.findUnique({
        where: { userId },
        select: {
          points: true,
          lifetimePoints: true,
          tier: true,
        },
      }),
      // B2B membership
      db.b2BAccountMember.findFirst({
        where: { userId },
        include: {
          account: {
            select: {
              companyName: true,
            },
          },
          costCenter: {
            select: {
              name: true,
              budget: true,
              spent: true,
            },
          },
        },
      }),
      // Shopping lists
      db.shoppingList.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
        take: 3,
      }),
    ]);

  // Get order statistics
  const orderStats = await db.order.groupBy({
    by: ['status'],
    where: { userId },
    _count: true,
  });

  // Get pending approvals count (B2B only)
  let pendingApprovals = 0;
  if (b2bMembership) {
    pendingApprovals = await db.orderApproval.count({
      where: {
        approverId: b2bMembership.id,
        status: 'PENDING',
      },
    });
  }

  return { user, orders, addresses, loyaltyProfile, orderStats, b2bMembership, pendingApprovals, shoppingLists };
}
```

---

## UI Components Breakdown

### 1. Welcome Header
```typescript
<div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
  <div className="container mx-auto px-4 py-12">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {user.name || 'User'}!
        </h1>
        <p className="text-safety-green-100">
          {user.accountType} Account • Member since{' '}
          {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>
      </div>
      {loyaltyProfile && (
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6 text-center">
          <Award className="w-5 h-5" />
          <span>Loyalty Points</span>
          <div className="text-3xl font-bold">{loyaltyProfile.points.toLocaleString()}</div>
          <div>{loyaltyProfile.tier} Tier</div>
        </div>
      )}
    </div>
  </div>
</div>
```

### 2. B2B Membership Banner
```typescript
{b2bMembership && (
  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 mb-8">
    <div className="flex items-center gap-2 mb-2">
      <Users className="w-5 h-5" />
      <h3 className="font-bold text-lg">{b2bMembership.account.companyName}</h3>
    </div>
    <div className="text-sm text-blue-100">
      Role: {b2bMembership.role.replace(/_/g, ' ')}
      {b2bMembership.department && ` • ${b2bMembership.department}`}
      {b2bMembership.costCenter && ` • ${b2bMembership.costCenter.name}`}
    </div>
    {b2bMembership.orderLimit && (
      <div className="text-sm text-blue-100 mt-1">
        Order Limit: ${Number(b2bMembership.orderLimit).toLocaleString()}
      </div>
    )}
    <Link href="/b2b/team">
      <Button variant="outline">Manage Team</Button>
    </Link>
  </div>
)}
```

### 3. Quick Stats Cards (Responsive Grid)
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {/* Total Orders */}
  <div className="bg-white rounded-lg border p-6">
    <div className="p-3 bg-blue-100 rounded-lg">
      <Package className="w-6 h-6 text-blue-600" />
    </div>
    <span className="text-2xl font-bold">{totalOrders}</span>
    <div className="text-sm text-gray-600">Total Orders</div>
  </div>

  {/* Active Orders */}
  <div className="bg-white rounded-lg border p-6">
    <div className="p-3 bg-yellow-100 rounded-lg">
      <Clock className="w-6 h-6 text-yellow-600" />
    </div>
    <span className="text-2xl font-bold">{pendingOrders + processingOrders}</span>
    <div className="text-sm text-gray-600">Active Orders</div>
  </div>

  {/* Pending Approvals (B2B Approvers) OR Shipped Orders */}
  {b2bMembership && (b2bMembership.role === 'APPROVER' || b2bMembership.role === 'ACCOUNT_ADMIN') ? (
    <Link href="/b2b/approvals" className="bg-white rounded-lg border p-6 hover:bg-gray-50">
      <div className="p-3 bg-orange-100 rounded-lg">
        <CheckCircle className="w-6 h-6 text-orange-600" />
      </div>
      <span className="text-2xl font-bold">{pendingApprovals}</span>
      <div className="text-sm text-gray-600">Pending Approvals</div>
    </Link>
  ) : (
    <div className="bg-white rounded-lg border p-6">
      <div className="p-3 bg-safety-green-100 rounded-lg">
        <TrendingUp className="w-6 h-6 text-safety-green-600" />
      </div>
      <span className="text-2xl font-bold">{shippedOrders}</span>
      <div className="text-sm text-gray-600">Shipped Orders</div>
    </div>
  )}

  {/* Shopping Lists */}
  <Link href="/shopping-lists" className="bg-white rounded-lg border p-6 hover:bg-gray-50">
    <div className="p-3 bg-purple-100 rounded-lg">
      <ListChecks className="w-6 h-6 text-purple-600" />
    </div>
    <span className="text-2xl font-bold">{shoppingLists.length}</span>
    <div className="text-sm text-gray-600">Shopping Lists</div>
  </Link>
</div>
```

### 4. Recent Orders Section
```typescript
<div className="bg-white rounded-lg border">
  <div className="p-6 border-b flex items-center justify-between">
    <h2 className="text-xl font-bold">Recent Orders</h2>
    <Link href="/orders">
      <Button variant="outline" size="sm">View All</Button>
    </Link>
  </div>

  <div className="divide-y divide-gray-200">
    {orders.map((order) => (
      <div key={order.id} className="p-6 hover:bg-gray-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-bold">{order.orderNumber}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status]}`}>
                {order.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${paymentStatusColors[order.paymentStatus]}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">${Number(order.total).toFixed(2)}</div>
            <Link href={`/orders/${order.orderNumber}`}>
              <Button variant="link" size="sm">View Details</Button>
            </Link>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## User Flows

### Flow 1: Customer Views Dashboard (First Time)
```
1. Customer logs in successfully
2. System redirects to /dashboard
3. System loads all dashboard data in parallel
4. Dashboard displays:
   - Welcome message with name
   - Account type and join date
   - Empty orders state with "Browse Products" CTA
   - Quick actions sidebar
   - Empty addresses widget
5. Customer clicks "Browse Products"
6. Redirects to /products
```

### Flow 2: B2B Approver Views Dashboard
```
1. B2B approver logs in
2. System loads dashboard with B2B features
3. Dashboard displays:
   - B2B company banner at top
   - Pending approvals count in stats
   - Link to approvals page
4. Approver clicks on "Pending Approvals" card
5. Redirects to /b2b/approvals
6. Approver reviews and processes approvals
```

### Flow 3: Customer Reviews Recent Orders
```
1. Customer views dashboard
2. "Recent Orders" section shows last 5 orders
3. Each order displays:
   - Order number (clickable)
   - Status badges (order + payment)
   - Order date
   - Total amount
   - "View Details" link
4. Customer clicks on order number or "View Details"
5. Redirects to /orders/{orderNumber}
```

### Flow 4: Customer Uses Quick Actions
```
1. Customer views dashboard sidebar
2. Quick Actions section displays:
   - Shop Products
   - Quick Order Pad
   - Bulk Order Entry
   - View Orders
   - Manage Addresses
3. Customer clicks "Quick Order Pad"
4. Redirects to /quick-order
5. Customer can quickly enter SKUs to order
```

---

## Account Type-Specific Features

### B2C Customer Dashboard
```
- Standard welcome header
- Loyalty points display (if enrolled)
- Total orders, active orders, shipped orders stats
- Recent orders list
- Quick actions
- Saved addresses
- Account type badge (if special account)
```

### B2B Customer Dashboard
```
ALL B2C features PLUS:
- B2B membership banner with company info
- Role and department display
- Cost center information
- Order limit display
- "Manage Team" button (for admins)
- Conditional "Pending Approvals" stat (for approvers)
- Enhanced quick actions (bulk ordering)
```

### GSA Customer Dashboard
```
ALL B2C features PLUS:
- GSA account badge
- Contract information
- Government compliance messaging
- Special pricing indicators
- Contact account manager CTA
```

---

## Status Color Coding

```typescript
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-safety-green-100 text-safety-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-safety-green-100 text-safety-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};
```

---

## Key Technical Details

### Performance Optimizations
- Parallel data fetching with `Promise.all()` for all dashboard widgets
- Server-side rendering for instant page load
- Limited queries (recent 5 orders, top 3 addresses, top 3 shopping lists)
- Efficient groupBy for order statistics
- Conditional queries (approvals only for B2B members)

### Security Measures
- Server-side authentication check
- Admin users redirected to admin panel
- User-specific data isolation (userId filter on all queries)
- Session validation on every request

### Data Integrity
- Safe number formatting with toLocaleString()
- Null-safe rendering (user.name || 'User')
- Empty state handling for all widgets
- Conditional rendering based on account type

### User Experience
- Personalized greeting with user name
- Color-coded status badges for quick recognition
- Responsive grid layouts (1/2/4 columns)
- Empty states with clear CTAs
- Contextual quick actions based on account type
- Click-to-action cards (approvals, shopping lists)

---

## Future Enhancements

1. **Personalized Recommendations**
   - Frequently ordered products
   - Products based on order history
   - New arrivals in favorite categories

2. **Enhanced Analytics**
   - Spending trends chart
   - Order frequency graph
   - Category breakdown pie chart
   - Year-over-year comparisons

3. **Activity Feed**
   - Recent account activities
   - Order status updates
   - Approval notifications
   - System announcements

4. **Customizable Dashboard**
   - Drag-and-drop widget arrangement
   - Show/hide widgets preference
   - Custom quick actions
   - Widget size adjustments

5. **Advanced B2B Features**
   - Team activity summary
   - Departmental spending dashboard
   - Cost center budget visualization
   - Approval workflow metrics

6. **Smart Alerts**
   - Low stock favorites
   - Price drop notifications
   - Subscription renewal reminders
   - Payment due alerts (B2B)
