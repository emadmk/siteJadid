# Admin Banner Management Page

## Overview

The Banner Management page (`/admin/marketing/banners`) provides administrative tools for creating and managing promotional banners displayed on the website. This interface enables marketing administrators to design homepage banners, schedule banner rotations, conduct A/B tests, and track banner performance.

**File Location:** `/home/user/siteJadid/src/app/admin/marketing/banners/page.tsx`

**Route:** `/admin/marketing/banners`

---

## User Access Requirements

### Authorized Roles
- `MARKETING_MANAGER`
- `ADMIN`
- `SUPER_ADMIN`
- `CONTENT_MANAGER`

### Authentication Check
```typescript
// Basic authentication (should add role check)
const session = await getServerSession(authOptions);
if (!session?.user?.id) redirect('/auth/signin');
```

---

## Features List

### Core Features

1. **Banner Management**
   - Create new banners
   - Upload banner images
   - Edit existing banners
   - Delete/archive banners
   - Reorder banner priority

2. **Banner Types**
   - Hero banners (full-width)
   - Promotional strips
   - Category banners
   - Sidebar banners
   - Pop-ups/modals

3. **Scheduling**
   - Start date/time
   - End date/time
   - Always active option
   - Recurring schedules

4. **Targeting**
   - All visitors
   - Logged-in users only
   - Guest visitors
   - Customer segments
   - Geographic targeting

5. **A/B Testing**
   - Multiple banner variants
   - Traffic split percentage
   - Performance comparison
   - Winner selection

6. **Performance Tracking**
   - Impressions
   - Clicks
   - Click-through rate (CTR)
   - Conversion tracking

---

## UI Components Breakdown

### 1. Page Header with Action Button
```typescript
<div className="flex justify-between mb-6">
  <h1 className="text-3xl font-bold">Banner Management</h1>
  <Button>
    <Plus className="w-4 h-4 mr-2" />
    Add Banner
  </Button>
</div>
```

### 2. Empty State
```typescript
<div className="bg-white rounded-lg border p-6 text-center">
  <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
  <p className="text-gray-600">No banners configured. Add promotional banners.</p>
</div>
```

**Icons Used:**
- `Image` - Banner/media icon
- `Plus` - Add banner button

---

## Banner Configuration Options

### Banner Properties
```typescript
{
  id: string,
  name: string,
  imageUrl: string,
  mobileImageUrl?: string,
  linkUrl?: string,
  altText: string,

  // Placement
  position: 'HERO' | 'TOP_STRIP' | 'SIDEBAR' | 'POPUP',
  priority: number, // Display order

  // Scheduling
  startDate?: DateTime,
  endDate?: DateTime,
  isActive: boolean,

  // Targeting
  targetAudience: 'ALL' | 'LOGGED_IN' | 'GUEST' | 'SEGMENT',
  audienceFilter?: object,

  // A/B Testing
  variantGroup?: string,
  trafficPercentage?: number,

  // Tracking
  impressions: number,
  clicks: number,
  ctr: number,
  conversions: number
}
```

---

## Banner Positions

### 1. Hero Banner
```
Location: Homepage top, full-width
Size: 1920x600px (desktop), 768x400px (mobile)
Purpose: Main promotional message
Examples:
- Seasonal sales
- New product launches
- Brand messaging
```

### 2. Top Strip Banner
```
Location: Above header, full-width
Size: 1920x80px
Purpose: Announcements, urgent messages
Examples:
- Free shipping notice
- Limited time offers
- Store hours
```

### 3. Category Banner
```
Location: Category pages
Size: 1200x300px
Purpose: Category-specific promotions
Examples:
- Category sales
- Featured brands
- Buying guides
```

### 4. Sidebar Banner
```
Location: Right sidebar
Size: 300x600px
Purpose: Secondary promotions
Examples:
- Related products
- Seasonal items
- Email signup
```

### 5. Popup/Modal Banner
```
Location: Overlay on page
Size: 600x400px
Purpose: High-priority messages
Examples:
- First-time visitor discount
- Exit intent offers
- Newsletter signup
```

---

## User Flows

### Flow 1: View Banner Dashboard
```
1. Admin navigates to /admin/marketing/banners
2. System displays banner list or empty state
3. Admin reviews active/scheduled banners
4. Admin can create new banner
```

### Flow 2: Create New Banner
```
1. Admin clicks "Add Banner"
2. Banner creation form opens:
   - Banner name (internal)
   - Upload image (desktop)
   - Upload image (mobile) - optional
   - Alt text (for accessibility)
   - Link URL (where banner clicks go)
   - Position (hero, strip, sidebar, etc.)
   - Priority/order
3. Admin sets schedule:
   - Start date/time
   - End date/time
   - Or "Always active"
4. Admin sets targeting:
   - All visitors
   - Logged-in only
   - Customer segment
5. Admin saves banner
6. Banner goes live per schedule
```

### Flow 3: Schedule Banner Campaign
```
1. Admin creates multiple banners
2. For each banner:
   - Set start date (e.g., Black Friday 12:00 AM)
   - Set end date (e.g., Cyber Monday 11:59 PM)
3. System automatically shows/hides banners
4. Old banners archived after end date
```

### Flow 4: Set Up A/B Test
```
1. Admin creates Banner A (variant 1)
2. Admin creates Banner B (variant 2)
3. Admin sets:
   - Same position
   - Same schedule
   - Traffic split (50/50 or 70/30)
4. System rotates banners based on percentage
5. After test period:
   - Compare CTR and conversions
   - Select winner
   - Deactivate loser
```

### Flow 5: Track Banner Performance
```
1. Admin opens banner details
2. Dashboard shows:
   - Impressions: 50,000
   - Clicks: 2,500
   - CTR: 5.0%
   - Conversions: 125
   - Conversion rate: 0.25%
3. Admin analyzes performance
4. Admin optimizes or replaces banner
```

---

## Screenshots/Mockup Descriptions

### Empty State
```
┌─────────────────────────────────────────────────────┐
│ Banner Management                        [Add Banner]│
├─────────────────────────────────────────────────────┤
│                                                     │
│                    🖼️                               │
│                                                     │
│   No banners configured. Add promotional banners.   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Banner List (Future)
```
┌─────────────────────────────────────────────────────┐
│ Banner Management                        [Add Banner]│
├─────────────────────────────────────────────────────┤
│ Banner Name        Position  Status    CTR     ...  │
│─────────────────────────────────────────────────────│
│ Summer Sale Hero   HERO      Active    4.2%    ...  │
│ Free Shipping     TOP_STRIP  Active    2.1%    ...  │
│ New Arrivals      SIDEBAR    Scheduled -       ...  │
└─────────────────────────────────────────────────────┘
```

---

## Database Schema (Conceptual)

```prisma
model Banner {
  id              String   @id @default(cuid())
  name            String
  imageUrl        String
  mobileImageUrl  String?
  linkUrl         String?
  altText         String

  // Placement
  position        BannerPosition
  priority        Int      @default(0)

  // Scheduling
  startDate       DateTime?
  endDate         DateTime?
  isActive        Boolean  @default(true)

  // Targeting
  targetAudience  String   @default("ALL")
  audienceFilter  Json?

  // A/B Testing
  variantGroup    String?
  trafficPercentage Int?

  // Analytics
  impressions     Int      @default(0)
  clicks          Int      @default(0)
  conversions     Int      @default(0)

  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum BannerPosition {
  HERO
  TOP_STRIP
  CATEGORY
  SIDEBAR
  POPUP
  FOOTER
}
```

---

## Related APIs

### 1. GET /api/admin/marketing/banners
**Purpose:** Fetch all banners

**Response:**
```typescript
[
  {
    id: string,
    name: string,
    imageUrl: string,
    position: BannerPosition,
    isActive: boolean,
    impressions: number,
    clicks: number,
    ctr: number
  }
]
```

### 2. POST /api/admin/marketing/banners
**Purpose:** Create new banner

**Request Body:**
```typescript
{
  name: string,
  imageUrl: string,
  mobileImageUrl?: string,
  linkUrl?: string,
  altText: string,
  position: BannerPosition,
  priority?: number,
  startDate?: DateTime,
  endDate?: DateTime,
  targetAudience?: string
}
```

### 3. GET /api/banners/active
**Purpose:** Get active banners for frontend display

**Query Parameters:**
- `position` - Filter by position
- `userSegment` - For targeting

**Response:**
```typescript
[
  {
    id: string,
    imageUrl: string,
    mobileImageUrl?: string,
    linkUrl?: string,
    altText: string,
    position: string
  }
]
```

### 4. POST /api/banners/[id]/track
**Purpose:** Track impression or click

**Request Body:**
```typescript
{
  event: 'impression' | 'click',
  userId?: string,
  sessionId: string
}
```

---

## Code Snippets from Implementation

### Basic Empty State Component
```typescript
export default function BannersPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Banner Management</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>
      <div className="bg-white rounded-lg border p-6 text-center">
        <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">
          No banners configured. Add promotional banners.
        </p>
      </div>
    </div>
  );
}
```

---

## Future Enhancements

1. **Advanced Features**
   - Dynamic content insertion
   - Countdown timers
   - Animated banners
   - Video banners
   - Interactive elements

2. **Better Scheduling**
   - Recurring schedules (weekly, monthly)
   - Holiday presets
   - Timezone support
   - Batch scheduling

3. **Enhanced Targeting**
   - Behavior-based targeting
   - Cart value targeting
   - Previous purchase history
   - Device type targeting
   - Browser/OS targeting

4. **Analytics Integration**
   - Google Analytics events
   - Revenue attribution
   - Funnel tracking
   - Heat map integration

5. **Asset Management**
   - Media library
   - Image optimization
   - CDN integration
   - Version control

6. **Personalization**
   - AI-powered recommendations
   - User preference learning
   - Dynamic content based on behavior
   - Location-based content
