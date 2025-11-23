# GSA Customer Dashboard Page

## Overview

The GSA Customer Dashboard (`/gsa/dashboard`) is a specialized interface for government customers with GSA contracts. It displays contract information, agency details, and compliance status.

**File Location:** `/home/user/siteJadid/src/app/gsa/dashboard/page.tsx`

**Route:** `/gsa/dashboard`

---

## User Access Requirements

- User must be authenticated
- User must have a GSA profile
- Redirects to `/dashboard` if no GSA profile exists

---

## Features List

1. **Contract Information Card**
   - Contract number display
   - Agency name
   - Active status indicator

2. **Statistics Dashboard** (3 Cards)
   - Contract Number
   - Agency Name
   - Account Status

---

## Database Query

```typescript
const gsaProfile = await db.gSAProfile.findUnique({
  where: { userId: session.user.id },
});
```

---

## UI Components

### Statistics Cards
```typescript
<div className="grid grid-cols-3 gap-6 mb-8">
  <div className="bg-white rounded-lg border p-6">
    <ShieldCheck className="w-8 h-8 text-blue-600 mb-4" />
    <div className="text-2xl font-bold">{gsaProfile.contractNumber || 'Pending'}</div>
    <div className="text-sm text-gray-600">Contract Number</div>
  </div>

  <div className="bg-white rounded-lg border p-6">
    <FileText className="w-8 h-8 text-green-600 mb-4" />
    <div className="text-2xl font-bold">{gsaProfile.agencyName || 'N/A'}</div>
    <div className="text-sm text-gray-600">Agency</div>
  </div>

  <div className="bg-white rounded-lg border p-6">
    <Package className="w-8 h-8 text-purple-600 mb-4" />
    <div className="text-2xl font-bold">{gsaProfile.isActive ? 'Active' : 'Inactive'}</div>
    <div className="text-sm text-gray-600">Status</div>
  </div>
</div>
```

---

## Database Schema

```prisma
model GSAProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  contractNumber  String?
  agencyName      String?
  isActive        Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id])
}
```

---

## Future Enhancements

1. **Contract Compliance Tracking** - Track compliance requirements
2. **GSA Pricing Display** - Show GSA-specific pricing
3. **Order History** - GSA-specific order reports
4. **Document Management** - Upload/view contract documents
5. **Reporting** - GSA-compliant purchase reports
