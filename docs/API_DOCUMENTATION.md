# 🔌 API Documentation

This document describes the API endpoints available in the Sustainable Eco-Friendly Digital Nomads Directory application.

## 🔐 Authentication & Security

All API endpoints use **NextAuth.js v5** for authentication with comprehensive security measures.

### **Security Features: ✅ ENTERPRISE-GRADE**

- ✅ **JWT Strategy**: Secure token-based authentication with Edge compatibility
- ✅ **Role-Based Access Control**: 8-tier permission system (unidentifiedUser → superAdmin)
- ✅ **Session Management**: MongoDB-backed user persistence with JWT sessions
- ✅ **Security Headers**: X-Frame-Options, CSP, CSRF protection
- ✅ **Middleware Protection**: Route and API endpoint security enforcement
- ✅ **Multi-layer Validation**: Client-side + Server-side + Database validation

### **Authentication Status: ✅ COMPLETE & SECURE**

Our API security implementation includes:

- **Defense-in-depth**: Multiple security layers
- **Comprehensive RBAC**: Full role hierarchy with granular permissions
- **API Protection**: All protected endpoints validate authentication and authorization
- **Security Testing**: 188 E2E tests (172 passed, 16 skipped in latest run) covering authentication flows and RBAC

### **Role Hierarchy & API Access**

```
API Access Levels:
┌─────────────────┐  Level 5: superAdmin (All APIs + User Management)
│   superAdmin    │  
├─────────────────┤  Level 4: admin (All APIs except User Role Changes)
│     admin       │  
├─────────────────┤  Level 3: moderator (Content Moderation APIs)
│   moderator     │  
├─────────────────┤  Level 2: venueOwner (Own Listings + User APIs)
│  venueOwner     │  
├─────────────────┤  Level 1: editor/contentEditor (Content APIs)
│ editor/content  │  
├─────────────────┤  Level 0: user (User APIs + Reviews)
│      user       │  
└─────────────────┘  Public: Listings (read-only)
```

## 📋 API Endpoints by Category

### **🔐 Authentication Endpoints**

#### `POST /api/auth/signin`

**Purpose**: User authentication  
**Access**: Public  
**Security**: Rate limited, bcrypt password validation  

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

### **👥 User Management APIs**

#### `GET /api/user/dashboard`

**Purpose**: Get user dashboard data  
**Access**: Authenticated users only  
**Security**: Server-side session validation, role-based data filtering  

**Response**:

```json
{
  "user": { "id": "user_id", "role": "user", "name": "User Name" },
  "data": {
    "kind": "user|venueOwner",
    "favorites": [...],
    "metrics": { "favoritesCount": 5, "reviewsWritten": 3 }
  }
}
```

#### `PATCH /api/user/profile`

**Purpose**: Update user profile  
**Access**: Authenticated users (own profile only)  
**Security**: User ID validation, input sanitization  

### **🏢 Admin Management APIs**

#### `GET /api/admin/stats`

**Purpose**: Platform statistics for admin dashboard  
**Access**: admin, superAdmin only  
**Security**: Role validation, comprehensive audit logging  

**Response**:

```json
{
  "totalUsers": 1275,
  "totalListings": 412,
  "totalReviews": 964,
  "weeklySignups": 38,
  "pendingModeration": 6,
  "userRoles": { "admin": 5, "user": 1200 },
  "generatedAt": "2024-01-10T10:00:00.000Z"
}
```

#### `GET /api/admin/users`

**Purpose**: User management (list, search, pagination)  
**Access**: admin, superAdmin only  
**Security**: Admin role validation, data filtering  

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Results per page (max: 100, default: 20)
- `search`: Search by name or email
- `role`: Filter by user role

**Response**:

```json
{
  "users": [
    {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 10,
    "totalCount": 200
  }
}
```

#### `PATCH /api/admin/users`

**Purpose**: Update user role or status  
**Access**: superAdmin only (for role changes), admin+ (for status changes)  
**Security**: SuperAdmin role validation for role changes, prevents self-demotion  

**Body**:

```json
{
  "userId": "user_id",
  "role": "editor",        // SuperAdmin only
  "status": "inactive"     // Admin+ allowed
}
```

### **📝 Content Moderation APIs**

#### `GET /api/admin/moderation`

**Purpose**: Get moderation queue  
**Access**: admin, superAdmin only  
**Security**: Admin role validation, item filtering  

#### `POST /api/admin/moderation`

**Purpose**: Perform moderation action  
**Access**: admin, superAdmin only  
**Security**: Action validation, audit trail  

**Body**:

```json
{
  "moderationId": "mod_id",
  "action": "approve|restrict|dismiss|flag",
  "notes": "Moderation notes"
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
  "slug": "listing-slug"
}
```

**Response**:

```json
{
  "favorited": true,
  "message": "Added to favorites",
  "favoriteId": "favorite_document_id"
}
```

#### `DELETE /api/user/favorites`

**Purpose**: Remove listing from favorites (body-based)
**Access**: Authenticated users
**Body**:

```json
{
  "slug": "listing-slug"
}
```

**Response**:

```json
{
  "favorited": false,
  "message": "Removed from favorites"
}
```

#### `DELETE /api/user/favorites/[slug]`

**Purpose**: Remove listing from favorites (URL-based)  
**Access**: Authenticated users
**Response**:

```json
{
  "favorited": false,
  "message": "Removed from favorites"
}

```

#### `GET /api/user/dashboard`

**Purpose**: Get comprehensive user dashboard data
**Access**: Authenticated users
**Response**:

```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "image": "https://cdn.sanity.io/images/...",
      "role": "user",
      "memberSince": "2025-01-01T00:00:00.000Z",
      "completionPercentage": 85
    },
    "activity": {
      "level": "Medium",
      "totalFavorites": 12,
      "recentFavorites": [
        {
          "id": "fav_id",
          "listingId": "listing_id",
          "createdAt": "2025-05-30T00:00:00.000Z"
        }
      ],
      "analytics": {
        "totalSessions": 45,
        "averageSessionDuration": 15,
        "pageViews": 230,
        "searchQueries": 18,
        "reviewsSubmitted": 3,
        "lastLogin": "2025-05-31T08:00:00.000Z"
      },
      "engagement": {
        "mostViewedCategories": ["coworking", "cafe"],
        "preferredCities": ["Bangkok", "Chiang Mai"],
        "recentSearches": [
          {
            "query": "eco coworking",
            "timestamp": "2025-05-31T07:30:00.000Z"
          }
        ],
        "recentViews": [
          {
            "listingId": "listing_id",
            "viewedAt": "2025-05-31T07:25:00.000Z"
          }
        ]
      },
      "conversions": {
        "clickedExternalLinks": 8,
        "completedContactForms": 2,
        "premiumListingsViewed": 15,
        "mapInteractions": 25
      }
    },
    "preferences": {
      "location": {
        "country": "Thailand",
        "city": "Bangkok"
      },
      "notifications": {
        "email": true,
        "push": false
      },
      "ui": {
        "theme": "light",
        "language": "en"
      },
      "filters": {
        "defaultCategory": "coworking",
        "priceRange": ["$", "$$"]
      },
      "privacy": {
        "profileVisible": true,
        "analyticsEnabled": true
      }
    },
    "insights": {
      "achievements": [
        {
          "name": "Explorer",
          "description": "100+ page views"
        }
      ],
      "recommendations": [
        "Try using our search filters to discover hidden gems"
      ],
      "monthlyTrends": [
        {
          "month": "Jan",
          "sessions": 10,
          "pageViews": 45,
          "searches": 5
        }
      ]
    }
  }
}

```

#### `GET /api/user/preferences`

**Purpose**: Get user preferences
**Access**: Authenticated users
**Response**:

```json
{
  "success": true,
  "data": {
    "location": {
      "country": "Thailand",
      "city": "Bangkok",
      "timezone": "Asia/Bangkok"
    },
    "notifications": {
      "email": true,
      "push": false,
      "sms": false,
      "frequency": "weekly"
    },
    "ui": {
      "theme": "light",
      "language": "en",
      "currency": "USD",
      "dateFormat": "DD/MM/YYYY"
    },
    "filters": {
      "defaultCategory": "coworking",
      "priceRange": ["$", "$$"],
      "ecoTags": ["solar-powered", "zero-waste"],
      "radius": 10
    },
    "privacy": {
      "profileVisible": true,
      "analyticsEnabled": true,
      "locationSharing": false
    }
  }
}

```

#### `PUT /api/user/preferences`

**Purpose**: Update user preferences
**Access**: Authenticated users
**Body**:

```json
{
  "location": {
    "country": "Thailand",
    "city": "Chiang Mai"
  },
  "notifications": {
    "email": false,
    "push": true
  },
  "ui": {
    "theme": "dark",
    "language": "th"
  }
}

```

**Response**:

```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "updatedAt": "2025-05-31T08:30:00.000Z"
  }
}

```

#### `GET /api/user/analytics`

**Purpose**: Get user analytics data
**Access**: Authenticated users
**Query Parameters**:

- `timeRange`: Filter by time range (7d, 30d, 90d, all) - default: 30d

- `includeHistory`: Include detailed history (true/false) - default: false

**Response**:

```json
{
  "success": true,
  "data": {
    "activity": {
      "totalSessions": 45,
      "averageSessionDuration": 15,
      "pageViews": 230,
      "searchQueries": 18,
      "reviewsSubmitted": 3,
      "lastLogin": "2025-05-31T08:00:00.000Z"
    },
    "engagement": {
      "mostViewedCategories": [
        {
          "category": "coworking",
          "count": 45
        }
      ],
      "preferredCities": [
        {
          "city": "Bangkok",
          "count": 35
        }
      ],
      "searchPatterns": [
        {
          "query": "eco coworking",
          "count": 5,
          "timestamp": "2025-05-31T07:30:00.000Z"
        }
      ],
      "viewHistory": [
        {
          "listingId": "listing_id",
          "viewedAt": "2025-05-31T07:25:00.000Z",
          "duration": 45
        }
      ]
    },
    "conversions": {
      "clickedExternalLinks": 8,
      "completedContactForms": 2,
      "premiumListingsViewed": 15,
      "mapInteractions": 25
    },
    "timeRange": "30d",
    "generatedAt": "2025-05-31T08:30:00.000Z"
  }
}

```

#### `POST /api/user/analytics`

**Purpose**: Track user activity/events
**Access**: Authenticated users
**Body**:

```json
{
  "eventType": "page_view",
  "data": {
    "page": "/listings/eco-coworking-bangkok",
    "category": "coworking",
    "listingId": "listing_id",
    "duration": 45,
    "timestamp": "2025-05-31T08:30:00.000Z"
  }
}

```

**Response**:

```json
{
  "success": true,
  "message": "Event tracked successfully"
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

**Purpose**: Get single listing by slug. This endpoint directly fetches data from Sanity using a predefined GROQ query.
**Access**: Public
**Response**:

```json
{
  "listing": {
    "_id": "sanity_document_id",
    "_type": "listing",
    "_createdAt": "2025-01-15T10:00:00.000Z",
    "_updatedAt": "2025-06-16T18:30:00.000Z",
    "_rev": "sanity_revision_id",
    "name": "Sustainable Coworking Space",
    "slug": "sustainable-coworking-space-cityname",
    "description_short": "A brief description of the listing.",
    "description_long": "A more detailed and comprehensive description of the listing, including its features and eco-initiatives.",
    "category": "coworking",
    "city": {
      "_id": "city_document_id",
      "title": "City Name",
      "slug": "city-name"
    },
    "primaryImage": {
      "_type": "image",
      "asset": {
        "_ref": "image-asset-id",
        "_type": "reference",
        "url": "https://cdn.sanity.io/images/projectid/dataset/image-asset-id.jpg"
      },
      "alt": "Primary image of the listing"
    },
    "ecoTags": ["solar-powered", "plastic-free", "community-focused"],
    "digital_nomad_features": ["high-speed-wifi", "meeting-rooms", "ergonomic-chairs"],
    "last_verified_date": "2025-06-01",
    "reviews": 42,
    "addressString": "123 Eco Lane, Sustainable City, Country",
    "website": "https://example.com/listing",
    "contactInfo": "info@example.com / +1234567890",
    "openingHours": "Mon-Fri: 9am - 6pm, Sat: 10am - 4pm",
    "shortDescription": "Detailed notes about specific eco-friendly practices and sustainability efforts.",
    "sourceUrls": ["https://source1.com", "https://source2.com"],
    "rating": 4.7,
    "priceRange": "$$"
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

#### `GET /api/reviews/[slug]`

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
- [Project Sanity Client (`src/lib/sanity/client.ts`)](./app-next-directory/src/lib/sanity/client.ts)
- [Project Sanity Data Fetching (`src/lib/sanity/data.ts`)](./app-next-directory/src/lib/sanity/data.ts)
