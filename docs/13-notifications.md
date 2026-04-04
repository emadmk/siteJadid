# 13. Email & Notification System

## Email Infrastructure

### SMTP Config (`src/lib/email-notifications.ts`)
- **Provider**: Nodemailer via Gmail SMTP
- **Port**: 587 (STARTTLS)
- **Non-blocking**: All emails sent with `.catch()` - never breaks main flow
- **Logging**: Every email logged to `EmailLog` table

### Email Templates (`src/lib/email-templates.ts`)
~20,000 lines of branded HTML email templates with:
- Responsive design (600px container)
- ADA Supply branding (green gradient header, logo)
- Dynamic company info from DB settings (cached 5 min)

### Available Email Functions

| Function | Recipient | Trigger |
|----------|-----------|---------|
| `sendWelcomeEmail` | Customer | Registration |
| `sendVerificationNotification` | Customer | Email verify |
| `sendPasswordResetNotification` | Customer | Forgot password |
| `sendOrderConfirmation` | Customer | Order placed |
| `sendOrderStatusUpdate` | Customer | Status change |
| `sendPaymentReceivedNotification` | Customer | Payment confirmed |
| `sendContactConfirmation` | Customer | Contact form |
| `sendAccountApprovalNotification` | Customer | Account approved/rejected |
| `sendAdminNewOrderNotification` | All staff | New order |
| `sendAdminContactFormNotification` | All staff | Contact form |
| `sendAdminNewRegistrationNotification` | All staff | New registration |
| `sendAdminOrderStatusChangeNotification` | All staff | Order status change |
| `sendAdminQuoteRequestNotification` | All staff | Quote request |

### Staff Email Discovery
`getStaffEmails()` - Queries DB for active users with roles: SUPER_ADMIN, ADMIN, CUSTOMER_SERVICE

## In-App Notifications

### Database Model
```
Notification { userId, type, title, message, data (JSON), isRead, createdAt }
```

### Types
```
ORDER_UPDATE, SHIPMENT_UPDATE, PAYMENT_RECEIVED, 
REVIEW_SUBMITTED, PROMOTION, SYSTEM, LOYALTY_UPDATE
```

### Notification Bell (Admin Header)
- Polls every **30 seconds**
- Shows unread count badge
- **Clickable**: parses `data.url` field → navigates to page
- Mark as read (individual or all)
- Link to full notifications page

### Auto-created Notifications

| Event | Title | Navigates to |
|-------|-------|-------------|
| New order | `New Order #{number}` | `/admin/orders/{id}` |
| New registration | `New Registration: {name}` | `/admin/customers/approvals` |

### Customer Email Composer (`EmailComposer`)
Admin component with:
- Customer search/select or direct email input
- 20 pre-made quick templates (4 categories):
  - Order & Shipping (6 templates)
  - Account & Verification (4 templates)
  - Payment & Billing (4 templates)
  - Product & Support (6 templates)
- Branded template auto-wrapping
- Available on: Order detail page, Customer detail page

### Newsletter System
- **Subscribe**: POST `/api/newsletter/subscribe` (public, sends welcome email)
- **Admin**: `/admin/marketing/newsletter` (list, search, export CSV)
- **Model**: `NewsletterSubscriber` (email, status, source, subscribedAt)

---

*Next: [14 - Shipping & Tax](./14-shipping-tax.md)*
