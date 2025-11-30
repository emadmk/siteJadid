# Admin Email Campaign Builder Page

## Overview

The Email Campaign Builder page (`/admin/marketing/emails`) provides administrative tools for creating and managing email marketing campaigns. This interface enables marketing administrators to design email campaigns, schedule sends, manage templates, and track campaign performance.

**File Location:** `/home/user/siteJadid/src/app/admin/marketing/emails/page.tsx`

**Route:** `/admin/marketing/emails`

---

## User Access Requirements

### Authorized Roles
- `MARKETING_MANAGER`
- `ADMIN`
- `SUPER_ADMIN`

### Authentication Check
```typescript
// Basic authentication (should add role check)
const session = await getServerSession(authOptions);
if (!session?.user?.id) redirect('/auth/signin');
```

---

## Features List

### Core Features

1. **Campaign Management**
   - Create new campaigns
   - View campaign list
   - Edit draft campaigns
   - Schedule campaigns
   - Track sent campaigns

2. **Email Templates**
   - Pre-built templates
   - Custom HTML templates
   - Drag-and-drop editor
   - Template library

3. **Audience Targeting**
   - All customers
   - Customer segments
   - B2B customers only
   - GSA customers
   - Loyalty tiers
   - Custom lists

4. **Campaign Scheduling**
   - Send immediately
   - Schedule for later
   - Recurring campaigns
   - Time zone support

5. **Performance Tracking**
   - Send count
   - Open rate
   - Click-through rate
   - Conversion tracking
   - Unsubscribe rate

---

## UI Components Breakdown

### 1. Page Header with Action Button
```typescript
<div className="flex justify-between mb-6">
  <h1 className="text-3xl font-bold">Email Campaigns</h1>
  <Button>
    <Plus className="w-4 h-4 mr-2" />
    Create Campaign
  </Button>
</div>
```

### 2. Empty State
```typescript
<div className="bg-white rounded-lg border p-6 text-center">
  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
  <p className="text-gray-600">No campaigns yet. Create your first email campaign.</p>
</div>
```

**Icons Used:**
- `Mail` - Email/campaign icon
- `Plus` - Create campaign button

---

## Campaign Types

### 1. Promotional Campaigns
```
Purpose: Sales, discounts, special offers
Audience: All customers or segments
Content: Product highlights, coupon codes
Timing: Seasonal, weekly sales
```

### 2. Transactional Emails
```
Purpose: Order confirmations, shipping updates
Audience: Individual customers
Content: Order details, tracking info
Timing: Immediate upon event
```

### 3. Newsletter Campaigns
```
Purpose: Company news, product updates
Audience: Subscribers
Content: Blog posts, new arrivals
Timing: Weekly or monthly
```

### 4. Abandoned Cart Campaigns
```
Purpose: Recover lost sales
Audience: Customers with items in cart
Content: Cart contents, incentives
Timing: 1 hour, 24 hours, 3 days after abandonment
```

### 5. Re-engagement Campaigns
```
Purpose: Win back inactive customers
Audience: No purchase in 90+ days
Content: Personalized offers, new products
Timing: Quarterly or as needed
```

---

## User Flows

### Flow 1: View Campaign Dashboard
```
1. Admin navigates to /admin/marketing/emails
2. System displays campaign list or empty state
3. Admin reviews active/scheduled campaigns
4. Admin can create new campaign
```

### Flow 2: Create Email Campaign
```
1. Admin clicks "Create Campaign"
2. Campaign creation form opens:
   - Campaign name
   - Subject line
   - Preview text
   - From name/email
   - Reply-to email
3. Admin selects template or creates custom
4. Admin designs email content:
   - Add text blocks
   - Insert images
   - Add product blocks
   - Insert CTAs (Call to Action)
5. Admin selects audience:
   - All customers
   - Segment (B2B, loyalty tier, etc.)
   - Custom list
6. Admin previews email
7. Admin schedules or sends:
   - Send now
   - Schedule for specific date/time
8. System validates and queues campaign
9. Campaign sent to recipients
```

### Flow 3: Track Campaign Performance
```
1. Admin opens sent campaign
2. Dashboard shows metrics:
   - Total sent: 5,000
   - Delivered: 4,950 (99%)
   - Opened: 1,485 (30%)
   - Clicked: 297 (6%)
   - Converted: 45 (0.9%)
   - Unsubscribed: 5 (0.1%)
3. Admin reviews:
   - Top clicked links
   - Geographic data
   - Device breakdown
4. Admin exports results
```

---

## Email Campaign Metrics

### Key Performance Indicators
```
Delivery Rate = (Delivered / Sent) × 100
Open Rate = (Opened / Delivered) × 100
Click Rate = (Clicked / Delivered) × 100
Conversion Rate = (Converted / Clicked) × 100
Unsubscribe Rate = (Unsubscribed / Delivered) × 100
```

### Industry Benchmarks (E-commerce)
```
Open Rate: 15-25%
Click Rate: 2-5%
Conversion Rate: 1-3%
Unsubscribe Rate: < 0.5%
```

---

## Database Schema (Conceptual)

```prisma
model EmailCampaign {
  id              String   @id @default(cuid())
  name            String
  subject         String
  previewText     String?
  fromName        String
  fromEmail       String
  replyTo         String?

  // Content
  htmlContent     String
  textContent     String?
  templateId      String?

  // Audience
  audienceType    String   // 'ALL', 'SEGMENT', 'CUSTOM'
  audienceFilter  Json?    // Segment criteria

  // Scheduling
  status          String   // 'DRAFT', 'SCHEDULED', 'SENDING', 'SENT'
  scheduledFor    DateTime?
  sentAt          DateTime?

  // Stats
  recipientCount  Int      @default(0)
  deliveredCount  Int      @default(0)
  openedCount     Int      @default(0)
  clickedCount    Int      @default(0)
  convertedCount  Int      @default(0)
  unsubscribedCount Int    @default(0)

  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## Screenshots/Mockup Descriptions

### Empty State
```
┌─────────────────────────────────────────────────────┐
│ Email Campaigns                    [Create Campaign]│
├─────────────────────────────────────────────────────┤
│                                                     │
│                    📧                               │
│                                                     │
│   No campaigns yet. Create your first email        │
│   campaign.                                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Campaign List (Future)
```
┌─────────────────────────────────────────────────────┐
│ Email Campaigns                    [Create Campaign]│
├─────────────────────────────────────────────────────┤
│ Campaign Name          Status     Sent    Open Rate │
│─────────────────────────────────────────────────────│
│ Summer Sale 2024       SENT       5,000   28.5%     │
│ New Arrivals          SCHEDULED   -       -         │
│ Cart Recovery         DRAFT       -       -         │
└─────────────────────────────────────────────────────┘
```

---

## Related APIs

### 1. GET /api/admin/marketing/campaigns
**Purpose:** Fetch all campaigns

**Response:**
```typescript
[
  {
    id: string,
    name: string,
    subject: string,
    status: string,
    recipientCount: number,
    openRate: number,
    scheduledFor?: DateTime,
    sentAt?: DateTime
  }
]
```

### 2. POST /api/admin/marketing/campaigns
**Purpose:** Create new campaign

**Request Body:**
```typescript
{
  name: string,
  subject: string,
  previewText?: string,
  fromName: string,
  fromEmail: string,
  htmlContent: string,
  audienceType: string,
  audienceFilter?: object,
  scheduledFor?: DateTime
}
```

### 3. POST /api/admin/marketing/campaigns/[id]/send
**Purpose:** Send or schedule campaign

**Request Body:**
```typescript
{
  sendNow: boolean,
  scheduledFor?: DateTime
}
```

### 4. GET /api/admin/marketing/campaigns/[id]/stats
**Purpose:** Get campaign performance statistics

**Response:**
```typescript
{
  sent: number,
  delivered: number,
  opened: number,
  clicked: number,
  converted: number,
  unsubscribed: number,
  openRate: number,
  clickRate: number,
  conversionRate: number
}
```

---

## Code Snippets from Implementation

### Basic Empty State Component
```typescript
export default function EmailCampaignsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Email Campaigns</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>
      <div className="bg-white rounded-lg border p-6 text-center">
        <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">
          No campaigns yet. Create your first email campaign.
        </p>
      </div>
    </div>
  );
}
```

---

## Future Enhancements

1. **Rich Email Editor**
   - Drag-and-drop interface
   - Pre-built content blocks
   - Image library integration
   - Product insertion
   - Dynamic personalization

2. **Advanced Segmentation**
   - Behavior-based segments
   - Purchase history
   - Geographic location
   - Engagement level
   - Custom attributes

3. **A/B Testing**
   - Subject line testing
   - Content variations
   - Send time optimization
   - From name testing

4. **Automation**
   - Drip campaigns
   - Behavioral triggers
   - Event-based sends
   - Workflow builder

5. **Integration**
   - Email service providers (SendGrid, Mailchimp)
   - Analytics platforms
   - CRM systems
   - Social media

6. **Compliance**
   - GDPR compliance tools
   - Unsubscribe management
   - Preference center
   - Consent tracking
