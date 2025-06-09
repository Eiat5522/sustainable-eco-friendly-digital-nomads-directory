# 🔌 API Documentation

This document describes the API endpoints available in the Sustainable Eco-Friendly Digital Nomads Directory application.
**Last Updated: May 28, 2025**

## 🔐 Authentication

All API endpoints use **NextAuth.js** for authentication with JWT tokens and role-based access control.

### Authentication Status: ✅ COMPLETED

- **JWT Strategy**: Secure token-based authentication
- **Role-Based Access**: 5-tier permission system
- **Session Management**: MongoDB-backed sessions
- **Security**: bcryptjs password hashing, rate limiting

## 📋 API Endpoints

### Authentication Endpoints

#### `POST /api/auth/signin`

**Purpose**: User authentication
**Access**: Public
**Body**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "user",
    "name": "User Name"
  },
  "expires": "2025-06-26T12:00:00.000Z"
}
```

#### `POST /api/auth/signup`

**Purpose**: User registration
**Access**: Public
**Body**:

```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "securePassword123"
}
```

#### `POST /api/auth/signout`

**Purpose**: User logout
**Access**: Authenticated users
**Response**: Session termination

### User Management Endpoints

#### `GET /api/user/profile`

**Purpose**: Get current user profile
**Access**: Authenticated users
**Response**:

```json
{
  "id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "role": "user",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

#### `PUT /api/user/profile`

**Purpose**: Update user profile
**Access**: Authenticated users
**Body**:

```json
{
  "name": "Updated Name",
  "preferences": {
    "theme": "light",
    "notifications": false
  }
}
```

#### `GET /api/user/favorites`

**Purpose**: Get user's favorite listings
**Access**: Authenticated users
**Response**:

```json
{
  "favorites": [
    {
      "id": "listing_id",
      "name": "Eco Coworking Space",
      "city": "Bangkok",
      "addedAt": "2025-05-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/user/favorites`

**Purpose**: Add listing to favorites
**Access**: Authenticated users
**Body**:

```json
{
  "listingId": "listing_id"
}
```

### Listings Endpoints

#### `GET /api/listings`

**Purpose**: Get all listings with filtering
**Access**: Public
**Query Parameters**:

- `city`: Filter by city
- `category`: Filter by category (coworking, cafe, accommodation)
- `ecoTags`: Filter by eco tags (comma-separated)
- `search`: Text search
- `page`: Pagination (default: 1)
- `limit`: Items per page (default: 20)
- `latitude`: Latitude for geo-search (requires longitude and radius)
- `longitude`: Longitude for geo-search (requires latitude and radius)
- `radius`: Search radius in kilometers for geo-search
- `[other_advanced_eco_filters]`: Placeholder for any other specific advanced eco-filter parameters (e.g., `minSustainabilityScore`, `hasCertificationType`)

**Response**:

```json
{
  "listings": [
    {
      "id": "listing_id",
      "name": "Green Coworking Hub",
      "description": "Sustainable workspace with solar panels",
      "category": "coworking",
      "city": "Bangkok",
      "ecoTags": ["solar-powered", "zero-waste"],
      "rating": 4.5,
      "priceRange": "$$",
      "image": "https://cdn.sanity.io/images/...",
      "coordinates": {
        "lat": 13.7563,
        "lng": 100.5018
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### `GET /api/listings/[slug]`

**Purpose**: Get single listing by slug
**Access**: Public
**Response**:

```json
{
  "listing": {
    "id": "listing_id",
    "name": "Green Coworking Hub",
    "slug": "green-coworking-hub-bangkok",
    "description": "Detailed description...",
    "fullDescription": "Extended content...",
    "category": "coworking",
    "city": "Bangkok",
    "address": "123 Sustainable Street",
    "coordinates": {
      "lat": 13.7563,
      "lng": 100.5018
    },
    "ecoTags": ["solar-powered", "zero-waste", "organic-food"],
    "nomadFeatures": ["fast-wifi", "standing-desks", "meeting-rooms"],
    "rating": 4.5,
    "reviewCount": 24,
    "priceRange": "$$",
    "hours": {
      "monday": "08:00-22:00",
      "tuesday": "08:00-22:00"
    },
    "images": [
      {
        "url": "https://cdn.sanity.io/images/...",
        "alt": "Main workspace area"
      }
    ],
    "contact": {
      "phone": "+66 2 123 4567",
      "email": "info@greencoworking.com",
      "website": "https://greencoworking.com"
    },
    "sustainability": {
      "certifications": ["LEED Gold", "Green Building"],
      "practices": ["Solar panels", "Rainwater harvesting"],
      "score": 4.2
    }
  }
}
```

#### `POST /api/listings` (Admin Only)

**Purpose**: Create new listing
**Access**: Admin, VenueOwner
**Body**:

```json
{
  "name": "New Eco Venue",
  "description": "Description...",
  "category": "cafe",
  "city": "Chiang Mai",
  "address": "456 Green Street",
  "coordinates": {
    "lat": 18.7883,
    "lng": 98.9853
  },
  "ecoTags": ["organic-food", "renewable-energy"],
  "priceRange": "$"
}
```

### Contact Endpoints

#### `POST /api/contact`

**Purpose**: Submit contact form inquiry
**Access**: Public
**Body**:

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "message": "I have a question about your platform."
}
```

**Response**:

- **Success (200 OK)**:

```json
{
  "message": "Your message has been sent successfully!"
}
```

- **Error (e.g., 400 Bad Request, 429 Too Many Requests, 500 Internal Server Error)**:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

**Notes**: Implements Nodemailer for email sending, Zod for validation, and rate limiting.

### Blog Endpoints

#### `GET /api/blog`

**Purpose**: Get a list of blog posts
**Access**: Public
**Query Parameters**:

- `page`: Pagination (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by blog post category (slug)
- `tag`: Filter by blog post tag (slug)

**Response**:

```json
{
  "posts": [
    {
      "slug": "my-first-blog-post",
      "title": "My First Blog Post",
      "excerpt": "A short summary of the blog post...",
      "coverImage": "https://cdn.sanity.io/images/.../image.jpg",
      "author": {
        "name": "Author Name",
        "picture": "https://cdn.sanity.io/images/.../author.jpg"
      },
      "date": "2025-05-28T10:00:00.000Z",
      "categories": [{ "name": "Travel", "slug": "travel" }],
      "tags": [{ "name": "Asia", "slug": "asia" }]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### `GET /api/blog/[slug]`

**Purpose**: Get a single blog post by its slug
**Access**: Public
**Response**:

```json
{
  "post": {
    "slug": "my-first-blog-post",
    "title": "My First Blog Post",
    "content": "<p>Full HTML content of the blog post...</p>",
    "coverImage": "https://cdn.sanity.io/images/.../image.jpg",
    "author": {
      "name": "Author Name",
      "picture": "https://cdn.sanity.io/images/.../author.jpg"
    },
    "date": "2025-05-28T10:00:00.000Z",
    "categories": [{ "name": "Travel", "slug": "travel" }],
    "tags": [{ "name": "Asia", "slug": "asia" }],
    "relatedPosts": [
      // Optional: array of related post summaries
    ]
  }
}
```

### Cities Endpoints

#### `GET /api/cities`

**Purpose**: Get all cities with listing counts
**Access**: Public
**Response**:

```json
{
  "cities": [
    {
      "id": "bangkok",
      "name": "Bangkok",
      "country": "Thailand",
      "description": "Vibrant capital with numerous eco-friendly venues",
      "coordinates": {
        "lat": 13.7563,
        "lng": 100.5018
      },
      "listingCount": 45,
      "featuredImage": "https://cdn.sanity.io/images/...",
      "ecoScore": 4.1
    }
  ]
}
```

#### `GET /api/cities/[slug]`

**Purpose**: Get city details with listings
**Access**: Public
**Response**:

```json
{
  "city": {
    "id": "bangkok",
    "name": "Bangkok",
    "description": "Detailed city description...",
    "ecoInitiatives": ["Bike sharing", "Green building program"],
    "nomadInfo": {
      "costOfLiving": "$$",
      "internetSpeed": "Fast",
      "coworkingSpaces": 23,
      "cafes": 18
    },
    "listings": [
      // Array of listings in this city
    ]
  }
}
```

### Reviews Endpoints

#### `GET /api/reviews/[listingId]`

**Purpose**: Get reviews for a listing
**Access**: Public
**Response**:

```json
{
  "reviews": [
    {
      "id": "review_id",
      "userId": "user_id",
      "userName": "John Doe",
      "rating": 5,
      "comment": "Excellent sustainable practices!",
      "ecoRating": 4.5,
      "nomadRating": 4.8,
      "createdAt": "2025-05-15T10:30:00.000Z",
      "verified": true
    }
  ],
  "stats": {
    "averageRating": 4.3,
    "totalReviews": 24,
    "ratingDistribution": {
      "5": 12,
      "4": 8,
      "3": 3,
      "2": 1,
      "1": 0
    }
  }
}
```

#### `POST /api/reviews`

**Purpose**: Submit new review
**Access**: Authenticated users
**Body**:

```json
{
  "listingId": "listing_id",
  "rating": 5,
  "comment": "Great eco-friendly workspace!",
  "ecoRating": 4.5,
  "nomadRating": 4.8
}
```

#### `PUT /api/admin/reviews/[reviewId]/status` (Admin Only)

**Purpose**: Update the status of a review (e.g., approve, reject)
**Access**: Admin, SuperAdmin
**Body**:

```json
{
  "status": "approved" // or "rejected", "pending"
}
```

**Response**:

- **Success (200 OK)**:

```json
{
  "message": "Review status updated successfully.",
  "review": {
    "id": "review_id",
    "status": "approved"
    // ...other review fields
  }
}
```

#### `GET /api/admin/reviews/stats` (Admin Only)

**Purpose**: Get statistics about reviews
**Access**: Admin, SuperAdmin
**Response**:

```json
{
  "stats": {
    "totalReviews": 950,
    "pendingApproval": 15,
    "approvedReviews": 900,
    "rejectedReviews": 35,
    "averageRatingOverall": 4.4
    // ...other relevant review stats
  }
}
```

### Admin Endpoints

#### `GET /api/admin/stats`

**Purpose**: Get admin dashboard statistics
**Access**: Admin, SuperAdmin
**Response**:

```json
{
  "stats": {
    "totalListings": 156,
    "totalUsers": 1234,
    "totalReviews": 892,
    "pendingReviews": 5,
    "newListings": 8,
    "activeUsers": 234
  }
}
```

#### `GET /api/admin/search/stats` (Admin Only)

**Purpose**: Get statistics about search queries
**Access**: Admin, SuperAdmin
**Response**:

```json
{
  "stats": {
    "totalSearchesToday": 500,
    "totalSearchesLast7Days": 3500,
    "popularSearchTerms": [
      { "term": "eco-friendly coworking bangkok", "count": 120 },
      { "term": "vegan cafe chiang mai", "count": 90 }
    ],
    "searchesWithNoResults": 25
    // ...other relevant search stats
  }
}
```

#### `GET /api/admin/users`

**Purpose**: Get user management data
**Access**: Admin, SuperAdmin
**Query Parameters**:

- `page`: Pagination
- `role`: Filter by role
- `search`: Search users

#### `PUT /api/admin/users/[userId]/role`

**Purpose**: Update user role
**Access**: SuperAdmin
**Body**:

```json
{
  "role": "editor"
}
```

#### `GET /api/admin/users/[userId]/analytics` (Admin Only)

**Purpose**: Get analytics for a specific user (placeholder for potential future endpoint)
**Access**: Admin, SuperAdmin
**Response**:

```json
{
  "analytics": {
    "userId": "user_id",
    "loginFrequencyLast30Days": 15,
    "favoriteCategories": ["coworking", "cafe"],
    "reviewsSubmitted": 5
    // ...other user-specific analytics
  }
}
```

**Note**: This is a conceptual endpoint. Actual implementation details may vary.

#### `POST /api/admin/listings/bulk-action` (Admin Only)

**Purpose**: Perform bulk actions on listings (e.g., publish, unpublish, delete)
**Access**: Admin, SuperAdmin
**Body**:

```json
{
  "action": "publish", // "unpublish", "delete"
  "listingIds": ["listing_id_1", "listing_id_2", "listing_id_3"]
}
```

**Response**:

- **Success (200 OK)**:

```json
{
  "message": "Bulk action completed successfully.",
  "results": {
    "successCount": 3,
    "failedCount": 0,
    "errors": [] // Array of error details if any
  }
}
```

#### `PUT /api/admin/content/[contentId]/status` (Admin Only)

**Purpose**: Generic endpoint for moderating various content types (e.g., listings, user-generated content beyond reviews)
**Access**: Admin, SuperAdmin
**Body**:

```json
{
  "contentType": "listing", // "comment", "forumPost", etc.
  "status": "approved" // "rejected", "needs_review"
}
```

**Response**:

- **Success (200 OK)**:

```json
{
  "message": "Content status updated successfully.",
  "content": {
    "id": "contentId",
    "type": "listing",
    "status": "approved"
  }
}
```

**Note**: This is a conceptual endpoint for broader content moderation. Specific implementations might vary.

## 🔒 Role-Based Access Control

### User Roles & Permissions

| Endpoint                      | User | Editor | VenueOwner | Admin | SuperAdmin |
| ----------------------------- | ---- | ------ | ---------- | ----- | ---------- |
| `GET /api/listings`           | ✅   | ✅     | ✅         | ✅    | ✅         |
| `POST /api/listings`          | ❌   | ❌     | ✅         | ✅    | ✅         |
| `PUT /api/listings/[id]`      | ❌   | ❌     | Own only   | ✅    | ✅         |
| `DELETE /api/listings/[id]`   | ❌   | ❌     | ❌         | ✅    | ✅         |
| `GET /api/admin/*`            | ❌   | ❌     | ❌         | ✅    | ✅         |
| `PUT /api/admin/users/*/role` | ❌   | ❌     | ❌         | ❌    | ✅         |

## 🛠️ Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error

## 🔄 Rate Limiting

### Limits by Endpoint Type

- **Authentication**: 5 requests per minute per IP
- **Public APIs**: 100 requests per minute per IP
- **Authenticated APIs**: 1000 requests per minute per user
- **Admin APIs**: 500 requests per minute per user

## 📊 Response Formats

### Pagination

All paginated endpoints follow this format:

```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 200,
    "itemsPerPage": 20,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Timestamps

All timestamps are in ISO 8601 format (UTC):

```json
{
  "createdAt": "2025-05-26T12:00:00.000Z",
  "updatedAt": "2025-05-26T15:30:00.000Z"
}
```

## 🧪 Testing

### API Testing Coverage

- **120+ test cases** covering all endpoints
- **Authentication flow** validation
- **Role-based access** verification
- **Error handling** scenarios
- **Rate limiting** validation

### Running API Tests

```bash
# From app-next-directory/
npm run test:api              # All API tests
npm run test:auth             # Authentication tests
npm run test:rbac             # Role-based access tests
```

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Sanity API Reference](https://www.sanity.io/docs/http-api)
