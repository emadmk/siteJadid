# Enhanced Customer Profile Page

## Overview

The Enhanced Profile Page (`/profile`) provides customers with a comprehensive view of their account information, including personal details, B2B membership status, GSA account information, loyalty program details, and quick access to account management features. The page adapts based on account type (B2C, B2B, GSA).

**File Location:** `/home/user/siteJadid/src/app/profile/page.tsx`

**Route:** `/profile`

---

## User Access Requirements

### Authorized Users
- All authenticated customers (B2C, B2B, GSA)

### Authentication Check
```typescript
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  redirect('/auth/signin?callbackUrl=/profile');
}
```

---

## Features List

### Core Features
1. **Personal Information Card**
   - Full name, email (with verification badge), phone
   - Account type display (B2C/B2B/GSA)
   - User role, member since date
   - Edit profile button

2. **B2B Business Account Card** (B2B accounts only)
   - Company name, Tax ID/EIN
   - Payment terms (Net 30, etc.)
   - Credit limit and credit used
   - Visual credit usage progress bar
   - Account status badge

3. **B2B Team Member Role Card** (B2B multi-user accounts)
   - Company name
   - Member role and active status
   - Department and cost center assignment
   - Personal order limit
   - Cost center budget visualization
   - "Manage Team" button (for admins/approvers)

4. **GSA Account Card** (GSA accounts only)
   - Agency name
   - Contract number
   - Active status badge
   - Verification status message

5. **Loyalty Program Widget** (Sidebar)
   - Current tier display
   - Available points
   - Lifetime points
   - "View Rewards" button
   - Gradient background styling

6. **Account Statistics** (Sidebar)
   - Total orders count
   - Saved addresses count
   - Reviews written count

7. **Quick Actions** (Sidebar)
   - View Orders
   - Manage Addresses
   - Security Settings

---

## Database Queries Used

### Get Complete User Profile
```typescript
async function getUserProfile(userId: string) {
  const [user, b2bMembership] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        accountType: true,
        role: true,
        image: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        loyaltyProfile: {
          select: {
            points: true,
            lifetimePoints: true,
            tier: true,
          },
        },
        b2bProfile: {
          select: {
            companyName: true,
            taxId: true,
            creditLimit: true,
            creditUsed: true,
            paymentTerms: true,
            status: true,
          },
        },
        gsaProfile: {
          select: {
            contractNumber: true,
            agencyName: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            orders: true,
            addresses: true,
            reviews: true,
          },
        },
      },
    }),
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
  ]);

  return { user, b2bMembership };
}
```

---

## UI Components Breakdown

### 1. Profile Header
```typescript
<div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
  <div className="container mx-auto px-4 py-12">
    <h1 className="text-4xl font-bold mb-2">My Profile</h1>
    <p className="text-safety-green-100">
      Manage your account settings and preferences
    </p>
  </div>
</div>
```

### 2. Personal Information Card
```typescript
<div className="bg-white rounded-lg border overflow-hidden">
  <div className="p-6 border-b flex items-center justify-between">
    <h2 className="text-xl font-bold">Personal Information</h2>
    <Link href="/profile/edit">
      <Button variant="outline" size="sm">Edit Profile</Button>
    </Link>
  </div>

  <div className="p-6 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <User className="w-4 h-4" />
          <span>Full Name</span>
        </div>
        <div className="text-base font-medium text-black">
          {user.name || 'Not provided'}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Mail className="w-4 h-4" />
          <span>Email Address</span>
        </div>
        <div className="text-base font-medium text-black">
          {user.email}
          {user.emailVerified && (
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
              Verified
            </span>
          )}
        </div>
      </div>
      {/* ... more fields */}
    </div>
  </div>
</div>
```

### 3. B2B Profile Card with Credit Visualization
```typescript
{user.b2bProfile && (
  <div className="bg-white rounded-lg border overflow-hidden">
    <div className="p-6 border-b">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-safety-green-600" />
        <h2 className="text-xl font-bold">Business Account</h2>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full ${
          user.b2bProfile.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
          user.b2bProfile.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
          user.b2bProfile.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {user.b2bProfile.status}
        </span>
      </div>
    </div>

    <div className="p-6 space-y-4">
      {/* Credit Usage Progress Bar */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Credit Used</div>
          <div className="text-2xl font-bold">
            ${Number(user.b2bProfile.creditUsed).toLocaleString()}
          </div>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-safety-green-600 h-2 rounded-full"
            style={{
              width: `${Math.min(
                (Number(user.b2bProfile.creditUsed) /
                  Number(user.b2bProfile.creditLimit)) * 100,
                100
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  </div>
)}
```

### 4. B2B Membership Card with Budget Tracker
```typescript
{b2bMembership && (
  <div className="bg-white rounded-lg border overflow-hidden">
    <div className="p-6 border-b">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">Team Member Role</h2>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full ${
          b2bMembership.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {b2bMembership.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>

    <div className="p-6 space-y-4">
      {/* Cost Center Budget Progress */}
      {b2bMembership.costCenter && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Cost Center Budget</div>
            <div className="text-lg font-bold">
              ${Number(b2bMembership.costCenter.spent).toLocaleString()} /{' '}
              ${Number(b2bMembership.costCenter.budget).toLocaleString()}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: `${Math.min(
                  (Number(b2bMembership.costCenter.spent) /
                    Number(b2bMembership.costCenter.budget)) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Manage Team Button */}
      {(b2bMembership.role === 'ACCOUNT_ADMIN' || b2bMembership.role === 'APPROVER') && (
        <div className="pt-4 border-t">
          <Link href="/b2b/team">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Manage Team Members
            </Button>
          </Link>
        </div>
      )}
    </div>
  </div>
)}
```

### 5. Loyalty Program Widget
```typescript
{user.loyaltyProfile && (
  <div className="bg-gradient-to-br from-safety-green-600 to-safety-green-700 rounded-lg p-6 text-white">
    <div className="flex items-center gap-2 mb-4">
      <Award className="w-6 h-6" />
      <h3 className="text-xl font-bold">Loyalty Program</h3>
    </div>

    <div className="mb-4">
      <div className="text-sm text-safety-green-100 mb-1">Current Tier</div>
      <div className="text-3xl font-bold">{user.loyaltyProfile.tier}</div>
    </div>

    <div className="mb-4">
      <div className="text-sm text-safety-green-100 mb-1">Available Points</div>
      <div className="text-4xl font-bold">
        {user.loyaltyProfile.points.toLocaleString()}
      </div>
    </div>

    <div className="pt-4 border-t border-safety-green-500">
      <div className="text-sm text-safety-green-100 mb-1">Lifetime Points</div>
      <div className="text-xl font-semibold">
        {user.loyaltyProfile.lifetimePoints.toLocaleString()}
      </div>
    </div>

    <Link href="/loyalty">
      <Button className="w-full mt-6 bg-white text-safety-green-700 hover:bg-gray-100">
        View Rewards
      </Button>
    </Link>
  </div>
)}
```

---

## Key Technical Details

### Performance Optimizations
- Parallel fetching of user profile and B2B membership data
- Server-side rendering for instant load
- Selective field inclusion (only necessary fields)
- Efficient use of _count for aggregations

### Security Measures
- Server-side authentication check
- User-specific data isolation
- Safe rendering of optional fields
- Email verification status display

### Data Visualization
- Credit usage progress bar (visual budget tracking)
- Cost center budget visualization
- Percentage-based progress indicators
- Color-coded status badges

### User Experience
- Conditional rendering based on account type
- Clear visual hierarchy with cards
- Icon-labeled fields for quick scanning
- Gradient headers for visual appeal
- Responsive 3-column layout (desktop: 2+1, mobile: 1)

---

## Future Enhancements

1. **Profile Completion Indicator**
   - Show profile completion percentage
   - Highlight missing information
   - Encourage complete profiles

2. **Account Activity Log**
   - Recent logins
   - Profile changes history
   - Security events

3. **Communication Preferences**
   - Email notification settings
   - SMS alerts toggle
   - Marketing preferences

4. **Connected Accounts**
   - Social media connections
   - Third-party integrations
   - SSO providers

5. **Enhanced Security**
   - Two-factor authentication setup
   - Session management
   - Login device history
