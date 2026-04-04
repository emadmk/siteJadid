# 4. Authentication & Authorization

## Authentication (NextAuth.js)

### Config: `src/lib/auth.ts`

- **Strategy**: JWT (stateless)
- **Session Duration**: 7 days
- **Provider**: Credentials (email + password)
- **Password**: bcrypt hashed
- **Role Refresh**: From DB every 60 seconds via JWT callback

### Login Flow

```
User submits email/password
  → Check account lockout (5 attempts / 15 min)
  → Find user in DB
  → Verify bcrypt password
  → Clear failed attempts
  → Create JWT token with: id, role, accountType, gsaApprovalStatus
  → Set session cookie (next-auth.session-token)
```

### JWT Callbacks

```typescript
// jwt callback - runs on every request
jwt({ token, user }) {
  // On login: set role, accountType from user
  // Every 60s: refresh role from DB (handles role changes, deactivation)
}

// session callback - exposes data to client
session({ session, token }) {
  // Maps JWT fields to session.user
}
```

### Account Lockout: `src/lib/account-lockout.ts`

- **Max attempts**: 5
- **Lockout duration**: 15 minutes
- **Storage**: Redis (production) / in-memory (fallback)

## Authorization

### Middleware: `src/middleware.ts`

```
Request → Middleware
  ├── Public routes → Pass through
  ├── /admin/* → Check JWT role in adminRoles[] → Redirect if not admin
  ├── /account/* → Check JWT exists → Redirect to signin
  └── API routes → Not intercepted (handled per-route)
```

**Admin roles allowed**: SUPER_ADMIN, ADMIN, ACCOUNTANT, CUSTOMER_SERVICE, WAREHOUSE_MANAGER, MARKETING_MANAGER, CONTENT_MANAGER

### Permission System: `src/lib/permissions.ts`

```typescript
type Permission = 
  | 'dashboard.view' | 'products.view' | 'products.create' | 'products.edit' | 'products.delete'
  | 'orders.view' | 'orders.manage'
  | 'customers.view' | 'customers.manage'
  | 'analytics.view'
  | 'accounting.view' | 'accounting.manage'
  | 'marketing.view' | 'marketing.manage'
  | 'inventory.view' | 'inventory.manage'
  | 'settings.view' | 'settings.manage';
```

### Role → Permission Matrix

| Permission | SUPER_ADMIN | ADMIN | ACCOUNTANT | CUSTOMER_SERVICE | WAREHOUSE_MGR | MARKETING_MGR | CONTENT_MGR |
|------------|:-----------:|:-----:|:----------:|:----------------:|:-------------:|:-------------:|:-----------:|
| dashboard.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| products.view | ✅ | ✅ | | ✅ | ✅ | ✅ | ✅ |
| products.create | ✅ | ✅ | | | | | ✅ |
| products.edit | ✅ | ✅ | | ✅ | | | ✅ |
| products.delete | ✅ | ✅ | | | | | |
| orders.view | ✅ | ✅ | ✅ | ✅ | ✅ | | |
| orders.manage | ✅ | ✅ | | ✅ | | | |
| customers.view | ✅ | ✅ | ✅ | ✅ | | ✅ | |
| customers.manage | ✅ | ✅ | | ✅ | | | |
| analytics.view | ✅ | ✅ | ✅ | | | ✅ | |
| accounting.view | ✅ | ✅ | ✅ | | | | |
| accounting.manage | ✅ | | ✅ | | | | |
| marketing.view | ✅ | ✅ | | | | ✅ | ✅ |
| marketing.manage | ✅ | ✅ | | | | ✅ | ✅ |
| inventory.view | ✅ | ✅ | | | ✅ | | |
| inventory.manage | ✅ | ✅ | | | ✅ | | |
| settings.view | ✅ | ✅ | | | | | |
| settings.manage | ✅ | | | | | | |

### API Route Authorization Pattern

```typescript
// Standard pattern in API routes
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ... handle request
}
```

### Impersonation: `src/lib/get-effective-session.ts`

SUPER_ADMIN can impersonate customers:
1. Set cookies: `impersonate_user_id`, `impersonate_admin_id`
2. `getEffectiveSession()` returns impersonated user's session
3. Admin panel blocked during impersonation
4. "Back to Admin" button visible

### Security Features

| Feature | Implementation |
|---------|---------------|
| **CSRF Protection** | Double-submit cookie (`__csrf`) |
| **CSP Headers** | Set in middleware (script-src, frame-src, etc.) |
| **Rate Limiting** | Redis-based sliding window (`src/lib/rate-limit.ts`) |
| **Captcha** | Cloudflare Turnstile on contact/quote forms |
| **Password Policy** | Min 8 chars, validated in `src/lib/password-policy.ts` |
| **Account Lockout** | 5 attempts → 15 min lockout |
| **XSS Prevention** | CSP headers + React auto-escaping |
| **SQL Injection** | Prisma ORM (parameterized queries) |

---

*Next: [05 - Admin Panel](./05-admin-panel.md)*
