# 11. User & Customer Management

## Registration Flow

```
POST /api/auth/signup →
  1. Rate limit check (5/min)
  2. Validate password policy (min 8 chars)
  3. Hash password (bcrypt)
  4. Create user with accountType based on selection
  5. Create verification token
  6. Send welcome email + verification link
  7. Send admin notification (all staff)
  8. Create in-app notification for admins
```

## Account Types & Approval

| Account Type | Auto-approved? | Requires |
|-------------|---------------|----------|
| PERSONAL / B2C | Yes | Email verification |
| VOLUME_BUYER / B2B | No | Admin approval |
| GOVERNMENT / GSA | No | Admin approval + docs |

### Approval Flow
```
User registers as Volume Buyer/Government →
  approvalStatus = PENDING →
  Admin reviews in /admin/customers/approvals →
  APPROVED or REJECTED →
  Email sent to user
```

## Admin User Management (`/admin/users`)

- **Create staff**: SUPER_ADMIN only
- **Edit role/status**: SUPER_ADMIN only
- **Available roles**: ADMIN, ACCOUNTANT, CUSTOMER_SERVICE, WAREHOUSE_MANAGER, MARKETING_MANAGER, CONTENT_MANAGER
- **Deactivate user**: Sets `isActive = false`, JWT refresh picks it up within 60s

## Customer Features

### Customer Detail Page (`/admin/customers/[id]`)
- Profile info, order history (last 10), addresses
- Account type badge, approval status
- Email composer (pre-filled)
- Impersonation button (SUPER_ADMIN)
- Role/status editing

### Customer Groups
- Custom segments for targeted discounts
- Manual member assignment
- Group-based pricing rules

### Tax Exemption
- Upload tax exemption certificate
- Admin reviews and approves
- Auto-exempt from tax on orders

## Impersonation System

```
SUPER_ADMIN clicks "Login as User" →
  Sets cookies: impersonate_user_id, impersonate_admin_id →
  getEffectiveSession() returns customer session →
  Admin sees storefront as customer →
  Yellow banner shows "Impersonating [Name]" →
  "Exit" button clears cookies
```

**Restrictions during impersonation**:
- Cannot access /admin
- Middleware redirects to /account
- Only SUPER_ADMIN can impersonate
- Cannot impersonate other admins

---

*Next: [12 - Search System](./12-search.md)*
