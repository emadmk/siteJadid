# Reviews API Documentation

## Overview
The Reviews API allows users to submit product reviews and ratings, and retrieve reviews for products or users. Includes verified purchase tracking, review moderation, and automatic product rating calculation.

**Base Path**: `/api/reviews`

---

## Endpoints

### 1. Get Reviews

**GET** `/api/reviews`

Returns reviews with filtering options for product, user, or all reviews. Supports pagination.

#### Authentication
- ❌ Not Required (public endpoint)

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| productId | string | ❌ No | - | Filter reviews by product |
| userId | string | ❌ No | - | Filter reviews by user |
| limit | number | ❌ No | 10 | Number of reviews per page |
| offset | number | ❌ No | 0 | Pagination offset |

#### Request
```http
GET /api/reviews?productId=prod_safety_vest&limit=5&offset=0 HTTP/1.1
Host: localhost:3000
```

#### Response (200 OK)
```json
{
  "reviews": [
    {
      "id": "review_abc123",
      "productId": "prod_safety_vest",
      "userId": "user_john",
      "orderId": null,
      "rating": 5,
      "title": "Excellent quality!",
      "comment": "These safety vests are top-notch. Very visible and comfortable to wear all day.",
      "status": "APPROVED",
      "isVerified": false,
      "helpfulCount": 12,
      "images": [
        "https://example.com/reviews/vest-photo-1.jpg"
      ],
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "user": {
        "id": "user_john",
        "name": "John Smith",
        "email": "john@example.com",
        "image": "https://example.com/avatars/john.jpg"
      },
      "product": {
        "id": "prod_safety_vest",
        "name": "High-Visibility Safety Vest",
        "slug": "high-visibility-safety-vest",
        "images": [
          "https://example.com/products/safety-vest-1.jpg"
        ]
      }
    },
    {
      "id": "review_def456",
      "productId": "prod_safety_vest",
      "userId": "user_jane",
      "orderId": "order_xyz789",
      "rating": 4,
      "title": "Good value",
      "comment": "Great product for the price. Fits well and very bright.",
      "status": "APPROVED",
      "isVerified": true,
      "helpfulCount": 8,
      "images": [],
      "createdAt": "2025-01-14T14:20:00.000Z",
      "updatedAt": "2025-01-14T14:20:00.000Z",
      "user": {
        "id": "user_jane",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "image": null
      },
      "product": {
        "id": "prod_safety_vest",
        "name": "High-Visibility Safety Vest",
        "slug": "high-visibility-safety-vest",
        "images": [
          "https://example.com/products/safety-vest-1.jpg"
        ]
      }
    }
  ],
  "total": 23,
  "limit": 5,
  "offset": 0
}
```

#### Review Status
- **PENDING**: Awaiting moderation
- **APPROVED**: Published and visible to all
- **REJECTED**: Not published

#### Verified Purchase
- **isVerified**: `true` if user purchased this product (based on `orderId`)
- Shows a "Verified Purchase" badge in UI

#### Error Responses
```json
// 500 Internal Server Error
{
  "error": "Failed to fetch reviews"
}
```

---

### 2. Create Review

**POST** `/api/reviews`

Submits a new product review. Users can only review each product once. Automatically updates product rating average.

#### Authentication
- ✅ Required

#### Request Body
```json
{
  "productId": "prod_safety_vest",
  "rating": 5,
  "title": "Excellent quality!",
  "comment": "These safety vests are top-notch. Very visible and comfortable to wear all day.",
  "images": [
    "https://example.com/reviews/vest-photo-1.jpg",
    "https://example.com/reviews/vest-photo-2.jpg"
  ]
}
```

#### Field Validation
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| productId | string | ✅ Yes | Valid product ID | Product must exist |
| rating | number | ✅ Yes | 1-5 (integer) | Star rating |
| title | string | ❌ No | Max 200 chars | Review headline |
| comment | string | ❌ No | Max 2000 chars | Detailed review |
| images | array | ❌ No | Max 5 images | Review photos (URLs) |

#### Rating Validation
- Must be an integer between 1 and 5 (inclusive)
- 1 star = Poor
- 2 stars = Fair
- 3 stars = Average
- 4 stars = Good
- 5 stars = Excellent

#### Response (201 Created)
```json
{
  "id": "review_new789",
  "productId": "prod_safety_vest",
  "userId": "user_john",
  "orderId": null,
  "rating": 5,
  "title": "Excellent quality!",
  "comment": "These safety vests are top-notch. Very visible and comfortable to wear all day.",
  "status": "PENDING",
  "isVerified": false,
  "helpfulCount": 0,
  "images": [
    "https://example.com/reviews/vest-photo-1.jpg",
    "https://example.com/reviews/vest-photo-2.jpg"
  ],
  "createdAt": "2025-01-16T15:30:00.000Z",
  "updatedAt": "2025-01-16T15:30:00.000Z",
  "user": {
    "id": "user_john",
    "name": "John Smith",
    "email": "john@example.com",
    "image": "https://example.com/avatars/john.jpg"
  },
  "product": {
    "id": "prod_safety_vest",
    "name": "High-Visibility Safety Vest",
    "slug": "high-visibility-safety-vest"
  }
}
```

#### Review Creation Flow
1. **Validate User**: Check authentication
2. **Validate Product**: Ensure product exists
3. **Check Duplicate**: Verify user hasn't already reviewed this product
4. **Create Review**: Save review with PENDING status
5. **Update Product Rating**: Calculate new average rating
6. **Check Verified Purchase**: Set `isVerified` if user purchased product (TODO)
7. **Return Review**: With user and product details

#### Product Rating Update
After creating a review, the product's average rating is automatically recalculated:
```typescript
const reviewStats = await db.review.aggregate({
  where: { productId, status: 'APPROVED' },
  _avg: { rating: true },
  _count: true
});

await db.product.update({
  where: { id: productId },
  data: { rating: reviewStats._avg.rating || 0 }
});
```

#### Error Responses
```json
// 400 Bad Request - Missing required fields
{
  "error": "Product ID and rating are required"
}

// 400 Bad Request - Already reviewed
{
  "error": "You have already reviewed this product"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 404 Not Found - Product doesn't exist
{
  "error": "Product not found"
}

// 500 Internal Server Error
{
  "error": "Failed to create review"
}
```

---

## Review Moderation

### Status Workflow

```
┌─────────────────┐
│  Review Created │
│  (PENDING)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Admin/Auto    │
│   Moderation    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼────┐ ┌──▼──────┐
│APPROVED│ │REJECTED │
│(Visible)│ │(Hidden) │
└────────┘ └─────────┘
```

### Moderation Guidelines
1. **Auto-Approve**: Reviews from verified purchases or trusted users
2. **Manual Review**: Reviews with flagged keywords, low ratings, or new users
3. **Reject**: Spam, inappropriate content, competitor mentions

### Helpful Count
Users can mark reviews as helpful:
- Increases `helpfulCount` field
- Used to sort "Most Helpful" reviews
- Future feature: Track which users found it helpful

---

## Implementation Details

### File Location
- Main route: `src/app/api/reviews/route.ts`
- Dynamic route: `src/app/api/reviews/[reviewId]/route.ts` (future)

### Database Model
```prisma
enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

model Review {
  id          String       @id @default(cuid())
  productId   String
  userId      String
  orderId     String?
  rating      Int          // 1-5
  title       String?
  comment     String?
  status      ReviewStatus @default(PENDING)
  isVerified  Boolean      @default(false)
  helpfulCount Int         @default(0)
  images      String[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  product     Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

### Security Features
- Users can only submit one review per product
- Status defaults to PENDING for moderation
- Automatic cleanup on product/user deletion
- Rating validation (1-5 only)

### Performance Optimizations
- Indexed by productId, userId, status, and createdAt
- Pagination support for large review sets
- Aggregated rating calculation
- Ordered by createdAt descending

---

## Usage Examples

### JavaScript/TypeScript (fetch)
```typescript
// Get reviews for a product
const reviews = await fetch('/api/reviews?productId=prod_safety_vest&limit=10', {
  credentials: 'include'
});
const { reviews: reviewList, total } = await reviews.json();
console.log(`${total} total reviews, showing ${reviewList.length}`);

// Submit a review
const newReview = await fetch('/api/reviews', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    productId: 'prod_safety_vest',
    rating: 5,
    title: 'Excellent product!',
    comment: 'Very satisfied with this purchase. Highly recommend!',
    images: []
  })
});

if (newReview.ok) {
  console.log('Review submitted!');
} else {
  const error = await newReview.json();
  console.error(error.error);
}

// Get user's reviews
const myReviews = await fetch('/api/reviews?userId=user_john', {
  credentials: 'include'
});
const { reviews: myReviewList } = await myReviews.json();
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

function useProductReviews(productId) {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 10;

  const fetchReviews = async () => {
    setLoading(true);
    const res = await fetch(
      `/api/reviews?productId=${productId}&limit=${limit}&offset=${page * limit}`
    );
    const data = await res.json();
    setReviews(data.reviews);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, page]);

  const submitReview = async (reviewData) => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        productId,
        ...reviewData
      })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }

    const newReview = await res.json();
    setReviews([newReview, ...reviews]);
    setTotal(total + 1);
    return newReview;
  };

  return {
    reviews,
    total,
    loading,
    page,
    setPage,
    submitReview,
    refresh: fetchReviews
  };
}

// Reviews Section Component
function ProductReviews({ productId }) {
  const { reviews, total, loading, page, setPage, submitReview } = useProductReviews(productId);
  const [showForm, setShowForm] = useState(false);

  if (loading && reviews.length === 0) {
    return <div>Loading reviews...</div>;
  }

  return (
    <div className="product-reviews">
      <div className="reviews-header">
        <h2>Customer Reviews ({total})</h2>
        <button onClick={() => setShowForm(true)}>Write a Review</button>
      </div>

      {showForm && (
        <ReviewForm
          onSubmit={async (data) => {
            await submitReview(data);
            setShowForm(false);
            alert('Review submitted! It will be visible after moderation.');
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="reviews-list">
        {reviews.map(review => (
          <div key={review.id} className="review">
            <div className="review-header">
              <div className="user-info">
                <img src={review.user.image || '/default-avatar.png'} alt={review.user.name} />
                <span>{review.user.name}</span>
                {review.isVerified && <span className="verified">✓ Verified Purchase</span>}
              </div>
              <div className="rating">
                {'⭐'.repeat(review.rating)}
              </div>
            </div>

            {review.title && <h4>{review.title}</h4>}
            {review.comment && <p>{review.comment}</p>}

            {review.images.length > 0 && (
              <div className="review-images">
                {review.images.map((img, i) => (
                  <img key={i} src={img} alt={`Review ${i + 1}`} />
                ))}
              </div>
            )}

            <div className="review-footer">
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
              <button>Helpful ({review.helpfulCount})</button>
            </div>
          </div>
        ))}
      </div>

      {total > 10 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>Page {page + 1} of {Math.ceil(total / 10)}</span>
          <button
            disabled={(page + 1) * 10 >= total}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

### Review Form Component
```typescript
function ReviewForm({ onSubmit, onCancel }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit({ rating, title, comment, images });
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h3>Write Your Review</h3>

      <div className="rating-input">
        <label>Rating:</label>
        <div className="stars">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={rating >= star ? 'active' : ''}
              onClick={() => setRating(star)}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Title (optional):</label>
        <input
          type="text"
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your review"
        />
      </div>

      <div className="form-group">
        <label>Review (optional):</label>
        <textarea
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product"
          rows={5}
        />
      </div>

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
```

### Rating Summary Component
```typescript
function RatingSummary({ productId }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // Fetch rating distribution
    fetch(`/api/reviews?productId=${productId}&limit=1000`)
      .then(res => res.json())
      .then(data => {
        const distribution = [0, 0, 0, 0, 0];
        data.reviews.forEach(r => distribution[r.rating - 1]++);

        const average = data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length;

        setSummary({
          average: average.toFixed(1),
          total: data.total,
          distribution
        });
      });
  }, [productId]);

  if (!summary) return null;

  return (
    <div className="rating-summary">
      <div className="average-rating">
        <span className="score">{summary.average}</span>
        <div className="stars">{'⭐'.repeat(Math.round(summary.average))}</div>
        <span className="count">{summary.total} reviews</span>
      </div>

      <div className="rating-bars">
        {[5, 4, 3, 2, 1].map(stars => {
          const count = summary.distribution[stars - 1];
          const percentage = (count / summary.total) * 100;

          return (
            <div key={stars} className="rating-bar">
              <span>{stars} ⭐</span>
              <div className="bar">
                <div className="fill" style={{ width: `${percentage}%` }} />
              </div>
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Best Practices

### Encouraging Reviews
1. **Post-purchase emails**: Request reviews 7-14 days after delivery
2. **Incentives**: Offer loyalty points for leaving reviews
3. **Make it easy**: Simple, mobile-friendly review form
4. **Show examples**: Display sample reviews to guide users

### Displaying Reviews
1. **Sort options**: Most recent, highest rated, most helpful
2. **Filter by rating**: Show only 5-star, 4-star, etc.
3. **Verified badge**: Highlight verified purchase reviews
4. **Photos first**: Prioritize reviews with images
5. **Helpful votes**: Allow users to mark reviews as helpful

### Moderation
1. **Auto-approve**: Trusted users and verified purchases
2. **Flag keywords**: Watch for profanity, competitor names
3. **Manual review**: Low ratings and sensitive content
4. **Response system**: Allow sellers to respond to reviews

---

## Related Documentation
- [Products API](../admin-api/products.md) - Product catalog with ratings
- [Orders API](./orders.md) - Verified purchase tracking
- [Product Page](../pages/customer-product-detail.md) - Reviews display
- [Admin Reviews](../pages/admin-reviews.md) - Review moderation
