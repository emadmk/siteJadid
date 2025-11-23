# B2B Team Management Page

## Overview

The B2B Team Management page (`/b2b/team`) is a comprehensive interface for managing team members within a B2B organization. This page allows account administrators to view all team members, their roles, permissions, cost centers, order limits, and activity status. It provides centralized control over multi-user B2B accounts.

**File Location:** `/home/user/siteJadid/src/app/b2b/team/page.tsx`

**Route:** `/b2b/team`

---

## User Access Requirements

### Authorized Account Types
- `B2B` accounts only

### Required Conditions
1. User must be authenticated
2. User must have `accountType: 'B2B'`
3. User must be a member of a B2B account

### Authentication Check
```typescript
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  redirect('/auth/signin?callbackUrl=/b2b/team');
}

if (session.user.accountType !== 'B2B') {
  redirect('/dashboard');
}
```

### Role-Based Features
- **ACCOUNT_ADMIN**: Can invite members, edit member details, view all information
- **Other roles**: Can only view team members (read-only access)

---

## Features List

### Core Features
1. **Team Statistics Dashboard**
   - Total members count
   - Admin members count
   - Active users count
   - Cost centers count

2. **Team Members Table**
   - Display all team members with detailed information
   - Show member name, email, role, department, cost center
   - Display order limits and activity status
   - Sortable by creation date (newest first)

3. **Member Information Display**
   - Name and email
   - Role badge with color coding
   - Department assignment
   - Cost center assignment
   - Personal order limit
   - Active/Inactive status

4. **Administrative Actions** (ACCOUNT_ADMIN only)
   - Invite new team members
   - Edit existing member details
   - Access to member management controls

5. **Role Management**
   - ACCOUNT_ADMIN - Full account control
   - PURCHASER - Can place orders
   - APPROVER - Can approve orders
   - VIEWER - Read-only access
   - FINANCE - Financial data access

---

## Database Queries Used

### 1. Get Team Data with Members
```typescript
async function getTeamData(userId: string) {
  const b2bProfile = await db.b2BProfile.findUnique({
    where: { userId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          costCenter: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      costCenters: {
        where: {
          isActive: true,
        },
      },
    },
  });

  return { b2bProfile };
}
```

### Database Schema (Related Models)

```prisma
model B2BProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  companyName     String
  taxId           String?
  creditLimit     Decimal  @db.Decimal(12, 2)
  creditUsed      Decimal  @default(0) @db.Decimal(12, 2)
  paymentTerms    Int      @default(30)
  status          B2BStatus @default(PENDING)

  user            User     @relation(fields: [userId], references: [id])
  members         B2BAccountMember[]
  costCenters     CostCenter[]
}

model B2BAccountMember {
  id              String   @id @default(cuid())
  accountId       String
  userId          String
  role            B2BRole
  department      String?
  costCenterId    String?
  orderLimit      Decimal? @db.Decimal(12, 2)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  account         B2BProfile @relation(fields: [accountId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
  costCenter      CostCenter? @relation(fields: [costCenterId], references: [id])
}

enum B2BRole {
  ACCOUNT_ADMIN
  PURCHASER
  APPROVER
  VIEWER
  FINANCE
}
```

---

## UI Components Breakdown

### 1. Statistics Cards (4 Cards Grid)
```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  {/* Total Members */}
  <div className="bg-white rounded-lg border p-6">
    <Users className="w-5 h-5 text-blue-600" />
    <div className="text-3xl font-bold text-black">{b2bProfile.members.length}</div>
    <span className="text-gray-600 text-sm">Total Members</span>
  </div>

  {/* Admins */}
  <div className="bg-white rounded-lg border p-6">
    <Shield className="w-5 h-5 text-red-600" />
    <div className="text-3xl font-bold text-black">
      {b2bProfile.members.filter((m) => m.role === 'ACCOUNT_ADMIN').length}
    </div>
    <span className="text-gray-600 text-sm">Admins</span>
  </div>

  {/* Active Users */}
  <div className="bg-white rounded-lg border p-6">
    <Users className="w-5 h-5 text-safety-green-600" />
    <div className="text-3xl font-bold text-black">
      {b2bProfile.members.filter((m) => m.isActive).length}
    </div>
    <span className="text-gray-600 text-sm">Active Users</span>
  </div>

  {/* Cost Centers */}
  <div className="bg-white rounded-lg border p-6">
    <DollarSign className="w-5 h-5 text-purple-600" />
    <div className="text-3xl font-bold text-black">{b2bProfile.costCenters.length}</div>
    <span className="text-gray-600 text-sm">Cost Centers</span>
  </div>
</div>
```

**Icons Used:**
- `Users` - Total and active members (blue/green)
- `Shield` - Admin count (red)
- `DollarSign` - Cost centers (purple)

### 2. Team Members Data Table
```typescript
<table className="w-full">
  <thead className="bg-gray-50">
    <tr>
      <th>Member</th>
      <th>Role</th>
      <th>Department</th>
      <th>Cost Center</th>
      <th>Order Limit</th>
      <th>Status</th>
      {isAdmin && <th>Actions</th>}
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {b2bProfile.members.map((member) => (
      <tr key={member.id} className="hover:bg-gray-50">
        {/* Member details */}
      </tr>
    ))}
  </tbody>
</table>
```

### 3. Role Badges (Color-coded)
```typescript
const roleLabels: Record<string, string> = {
  ACCOUNT_ADMIN: 'Account Admin',
  PURCHASER: 'Purchaser',
  APPROVER: 'Approver',
  VIEWER: 'Viewer',
  FINANCE: 'Finance',
};

const roleColors: Record<string, string> = {
  ACCOUNT_ADMIN: 'bg-red-100 text-red-800',
  PURCHASER: 'bg-blue-100 text-blue-800',
  APPROVER: 'bg-purple-100 text-purple-800',
  VIEWER: 'bg-gray-100 text-gray-800',
  FINANCE: 'bg-safety-green-100 text-safety-green-800',
};
```

### 4. Invite Member Button (Admin Only)
```typescript
{isAdmin && (
  <Link href="/b2b/team/invite">
    <Button className="gap-2 bg-primary hover:bg-primary/90">
      <Plus className="w-4 h-4" />
      Invite Member
    </Button>
  </Link>
)}
```

---

## User Flows

### Flow 1: View Team Members (All Roles)
```
1. User navigates to /b2b/team
2. System checks authentication and B2B account status
3. System fetches B2B profile with all members
4. Dashboard displays:
   - 4 statistics cards at top
   - Complete table of all team members below
5. User can see team composition at-a-glance
```

### Flow 2: Invite Team Member (ACCOUNT_ADMIN only)
```
1. Admin clicks "Invite Member" button
2. System redirects to /b2b/team/invite
3. Admin fills in:
   - Email address
   - Name
   - Role assignment
   - Department (optional)
   - Cost center (optional)
   - Order limit (optional)
4. System sends invitation email
5. New member receives email with signup link
6. Member completes registration
7. Member appears in team table
```

### Flow 3: Edit Team Member (ACCOUNT_ADMIN only)
```
1. Admin clicks "Edit" on member row
2. System redirects to /b2b/team/{memberId}/edit
3. Admin can modify:
   - Role
   - Department
   - Cost center assignment
   - Order limit
   - Active/Inactive status
4. System validates changes
5. Member information updated
6. Changes reflected immediately in team table
```

### Flow 4: View Team Member Details (All Roles)
```
1. User views team members table
2. System displays for each member:
   - Name and email
   - Role with color-coded badge
   - Department
   - Assigned cost center
   - Personal order limit or "Unlimited"
   - Active/Inactive status
3. User can identify team structure and permissions
```

---

## Member Role Permissions Matrix

```
┌──────────────────┬────────┬──────────┬─────────┬────────┬─────────┐
│ Permission       │ ADMIN  │ APPROVER │ PURCHASER│ VIEWER │ FINANCE │
├──────────────────┼────────┼──────────┼─────────┼────────┼─────────┤
│ View Team        │   ✓    │    ✓     │    ✓    │   ✓    │    ✓    │
│ Invite Members   │   ✓    │    ✗     │    ✗    │   ✗    │    ✗    │
│ Edit Members     │   ✓    │    ✗     │    ✗    │   ✗    │    ✗    │
│ Place Orders     │   ✓    │    ✓     │    ✓    │   ✗    │    ✗    │
│ Approve Orders   │   ✓    │    ✓     │    ✗    │   ✗    │    ✗    │
│ View Financials  │   ✓    │    ✗     │    ✗    │   ✗    │    ✓    │
└──────────────────┴────────┴──────────┴─────────┴────────┴─────────┘
```

---

## Screenshots/Mockup Descriptions

### Main Team Management View
```
┌─────────────────────────────────────────────────────────────┐
│ Team Management                                              │
│ Acme Corporation                            [Invite Member]  │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ 👥 15    │ │ 🛡️ 3     │ │ ✓ 14     │ │ 💰 5     │        │
│ │ Members  │ │ Admins   │ │ Active   │ │ Centers  │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│ Team Members                                                 │
├─────────────────────────────────────────────────────────────┤
│ Member         Role       Dept    Center  Limit   Status  … │
│────────────────────────────────────────────────────────────││
│ John Smith     [ADMIN]    Ops     OPS-01  $50K    Active  …│
│ jane@co.com                                                  │
│────────────────────────────────────────────────────────────││
│ Jane Doe       [PURCHASER] Proc   PROC-01 $10K    Active  …│
│ jane@co.com                                                  │
└─────────────────────────────────────────────────────────────┘
```

### Member Row Detail
```
For ACCOUNT_ADMIN viewing:
┌─────────────────────────────────────────────────────────┐
│ John Smith                    [Account Admin]            │
│ john.smith@acme.com           Operations                 │
│                               OPS-01                      │
│                               $50,000                     │
│                               [Active]          [Edit]   │
└─────────────────────────────────────────────────────────┘

For non-admin viewing:
┌─────────────────────────────────────────────────────────┐
│ John Smith                    [Account Admin]            │
│ john.smith@acme.com           Operations                 │
│                               OPS-01                      │
│                               $50,000                     │
│                               [Active]                    │
└─────────────────────────────────────────────────────────┘
```

---

## Related APIs

### 1. GET /api/b2b/team
**Purpose:** Fetch all team members for the authenticated user's B2B account

**Response:**
```typescript
{
  companyName: string,
  members: [
    {
      id: string,
      user: {
        id: string,
        name: string,
        email: string,
        phone: string,
        isActive: boolean
      },
      role: B2BRole,
      department: string | null,
      costCenter: {
        id: string,
        name: string,
        code: string
      } | null,
      orderLimit: Decimal | null,
      isActive: boolean,
      createdAt: DateTime
    }
  ],
  costCenters: CostCenter[]
}
```

### 2. POST /api/b2b/team/invite
**Purpose:** Invite a new team member (ACCOUNT_ADMIN only)

**Request Body:**
```typescript
{
  email: string,
  name: string,
  role: B2BRole,
  department?: string,
  costCenterId?: string,
  orderLimit?: number
}
```

**Response:**
```typescript
{
  id: string,
  invitationSent: boolean,
  member: B2BAccountMember
}
```

### 3. PATCH /api/b2b/team/[memberId]
**Purpose:** Update team member details (ACCOUNT_ADMIN only)

**Request Body:**
```typescript
{
  role?: B2BRole,
  department?: string,
  costCenterId?: string,
  orderLimit?: number,
  isActive?: boolean
}
```

### 4. DELETE /api/b2b/team/[memberId]
**Purpose:** Remove team member from account (ACCOUNT_ADMIN only)

**Response:**
```typescript
{
  success: boolean,
  message: string
}
```

---

## Code Snippets from Implementation

### Admin Check
```typescript
// Check if current user is admin
const userMember = b2bProfile.members.find((m) => m.userId === session.user.id);
const isAdmin = userMember?.role === 'ACCOUNT_ADMIN';
```

### Order Limit Display
```typescript
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
  {member.orderLimit
    ? `$${Number(member.orderLimit).toLocaleString()}`
    : 'Unlimited'}
</td>
```

### Empty State Handling
```typescript
{b2bProfile.members.length === 0 && (
  <tr>
    <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
      No team members yet. Invite members to get started.
    </td>
  </tr>
)}
```

---

## Key Technical Details

### Performance Optimizations
- Single database query with nested includes for all related data
- Server-side rendering for instant page load
- Sorted by creation date (newest first) at database level
- Active cost centers filtered at query time

### Security Measures
- Server-side authentication check
- Account type verification (B2B only)
- Role-based UI rendering (admin features hidden from non-admins)
- Session validation on every request

### Data Integrity
- User can only access their own B2B account's members
- Role assignments validated against enum
- Order limits stored as precise decimals
- Audit trail with createdAt/updatedAt timestamps

### User Experience
- Color-coded role badges for quick identification
- Active/Inactive status clearly displayed
- Conditional actions based on user role
- Empty state with helpful guidance
- Responsive grid layout for statistics

---

## Future Enhancements

1. **Bulk Member Management**
   - Import members via CSV
   - Export member list to Excel
   - Bulk role assignments

2. **Advanced Filtering**
   - Filter by role
   - Filter by active/inactive status
   - Filter by department
   - Search by name or email

3. **Member Activity Tracking**
   - Last login timestamp
   - Recent orders placed
   - Approval activity history

4. **Enhanced Permissions**
   - Custom role creation
   - Granular permission settings
   - Role templates

5. **Team Analytics**
   - Order volume by member
   - Spending by member
   - Approval response times
   - Department spending analysis

6. **Notification System**
   - Alert when new members join
   - Notify on role changes
   - Member activity digest emails
