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

#### `DELETE /api/user/favorites/[listingId]`

**Purpose**: Remove listing from favorites
**Access**: Authenticated users
**Response**:

```json
{
  "success": true,
  "message": "Favorite removed successfully"
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

**Purpose**: Get single listing by slug
**Access**: Public
**Response**:

```json
{
  "listing": {
    "_id": "listing_id_from_sanity",
    "name": "Green Coworking Hub",
    "slug": "green-coworking-hub-bangkok",
    "description_short": "Sustainable workspace with solar panels.",
    "descriptionLong": "Extended content detailing the eco-initiatives, community, and facilities...",
    "category": "coworking",
    "city": "Bangkok", // Name of the city
    "addressString": "123 Sustainable Street, Bangkok",
    "primaryImage": {
      "asset": {
        "_id": "image-asset-id-primary",
        "url": "https://cdn.sanity.io/images/your_project_id/production/asset_id.jpg",
        "alt": "Main view of Green Coworking Hub"
        // metadata with dimensions could also be here
      }
    },
    "galleryImages": [
      {
        "asset": {
          "_id": "image-asset-id-gallery-1",
          "url": "https://cdn.sanity.io/images/your_project_id/production/gallery_asset_1.jpg",
          "alt": "Interior view of workspace"
        }
      },
      {
        "asset": {
          "_id": "image-asset-id-gallery-2",
          "url": "https://cdn.sanity.io/images/your_project_id/production/gallery_asset_2.jpg",
          "alt": "Community event at the hub"
        }
      }
    ],
    "ecoTags": ["solar-powered", "zero-waste", "organic-food"],
    "digital_nomad_features": ["fast-wifi", "standing-desks", "meeting-rooms"],
    "website": "https://greencoworking.com",
    "contactInfo": {
      "phone": "+66 2 123 4567",
      "email": "info@greencoworking.com"
    },
    "openingHours": "Mon-Fri: 08:00-22:00, Sat: 09:00-20:00",
    "ecoNotesDetailed": "Detailed notes about specific sustainability practices...",
    "sourceUrls": ["https://originalsource.com/article"],
    "last_verified_date": "2025-06-01",
    "reviews": [
      {
        "_id": "review_id_1",
        "rating": 5,
        "comment": "Excellent place with great eco-initiatives!",
        "author": { "name": "Jane Doe" }
      }
    ],
    // Category specific details, e.g., for 'coworking':
    "coworkingDetails": {
      "operatingHours": "Mon-Fri 9am-6pm", // This might be redundant if openingHours is used
      "pricingPlans": "Varies, see website",
      "specificAmenities": ["meeting rooms", "quiet zones"]
    }
    // Other fields like price_range might be here depending on category
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

**Purpose**: Get all cities with summary information (e.g., for a city listing page or filter).
**Access**: Public
**Response**: (Example - actual fields might vary based on `getAllCities` query)

```json
{
  "success": true,
  "data": [
    {
      "_id": "city_id_1",
      "title": "Bangkok",
      "slug": "bangkok",
      "country": "Thailand",
      "description": "Vibrant capital with numerous eco-friendly venues.",
      "mainImage": {
        "asset": {
          "_id": "image-asset-id-bangkok",
          "url": "https://cdn.sanity.io/images/your_project_id/production/bangkok_main.jpg",
          "alt": "Skyline of Bangkok"
        }
      },
      "sustainabilityScore": 75
      // Potentially listingCount if added to the query
    }
  ]
}
```

#### `GET /api/city/[slug]` (Note: path changed from `/api/cities/[slug]` for consistency with Next.js App Router)

**Purpose**: Get detailed information for a single city by its slug.
**Access**: Public
**Path Parameter**: `slug` (string) - The unique slug for the city.
**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "city_document_id_from_sanity",
    "title": "Chiang Mai",
    "slug": "chiang-mai",
    "country": "Thailand",
    "description": "A northern Thai city renowned for its relaxed atmosphere, rich culture, and growing number of sustainable initiatives. Popular with digital nomads for its affordability and access to nature.",
    "sustainabilityScore": 82,
    "highlights": [
      "Numerous vegetarian and vegan cafes with local sourcing.",
      "Active community in waste reduction and recycling programs.",
      "Easy access to national parks and elephant sanctuaries (choose ethical ones!).",
      "Growing number of co-working spaces with eco-friendly practices."
    ],
    "mainImage": {
      "asset": {
        "_id": "image-asset-id-chiang-mai",
        "url": "https://cdn.sanity.io/images/your_project_id/production/chiang_mai_main.jpg",
        "alt": "Scenic view of Doi Suthep temple in Chiang Mai",
        "metadata": {
          "dimensions": {
            "width": 1200,
            "height": 800
          }
        }
      }
    }
    // This endpoint focuses on city details. Listings for the city would typically be fetched via /api/listings?city=chiang-mai
  }
}
```
**Note**: The previous documentation for `GET /api/cities/[slug]` showed listings embedded. The new `GET /api/city/[slug]` route focuses on city-specific data. Listings for a city should be fetched using the `/api/listings` endpoint with a city filter (e.g., `/api/listings?city=slug`).

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
