# 🔌 API Documentation

This document describes the API endpoints available in the Sustainable Eco-Friendly Digital Nomads Directory application.

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
- `ecoTags`: Filter by eco tags
- `search`: Text search
- `page`: Pagination (default: 1)
- `limit`: Items per page (default: 20)

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

## 🔒 Role-Based Access Control

### User Roles & Permissions

| Endpoint | User | Editor | VenueOwner | Admin | SuperAdmin |
|----------|------|--------|------------|-------|------------|
| `GET /api/listings` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/listings` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `PUT /api/listings/[id]` | ❌ | ❌ | Own only | ✅ | ✅ |
| `DELETE /api/listings/[id]` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `GET /api/admin/*` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `PUT /api/admin/users/*/role` | ❌ | ❌ | ❌ | ❌ | ✅ |

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
