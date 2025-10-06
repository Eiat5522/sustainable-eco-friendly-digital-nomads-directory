# 🔌 API Documentation - Complete Reference

**Last Updated**: December 26, 2024  
**Status**: ✅ PRODUCTION-READY WITH ENTERPRISE SECURITY  
**Version**: v1.0

> **Consolidated from**: `docs/API_DOCUMENTATION.md`, `docs/app-next-directory/API_DOCUMENTATION.md`

---

## 🔐 **Authentication & Security**

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
- **Security Testing**: 120+ E2E tests covering authentication flows and RBAC

### **Role Hierarchy & API Access**

```
API Access Levels:
┌─────────────────┐  Level 6: superAdmin (All APIs + User Management)
│   superAdmin    │  
├─────────────────┤  Level 5: admin (Platform Management APIs)
│      admin      │  
├─────────────────┤  Level 4: moderator (Content Moderation APIs)
│   moderator     │  
├─────────────────┤  Level 3: contentEditor (Content Creation APIs)
│ contentEditor   │  
├─────────────────┤  Level 2: editor/venueOwner (Limited Management APIs)
│ editor/venue    │  
├─────────────────┤  Level 1: user (Basic User APIs)
│      user       │  
├─────────────────┤  Level 0: unidentifiedUser (Public APIs Only)
│ unidentified    │  
└─────────────────┘
```

---

## 📋 **API Endpoints**

### **Authentication Endpoints**

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
  "token": "jwt_token_here"
}
```

#### `POST /api/auth/signup`

**Purpose**: User registration  
**Access**: Public  
**Body**:

```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "New User",
  "confirmPassword": "securePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "new_user_id",
    "email": "newuser@example.com",
    "role": "user"
  }
}
```

#### `POST /api/auth/signout`

**Purpose**: User logout  
**Access**: Authenticated users  
**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### **Listing Management APIs**

#### `GET /api/listings`

**Purpose**: Retrieve listings with filtering and pagination  
**Access**: Public  
**Query Parameters**:

- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `city` (string): Filter by city slug
- `listingType` (string): Filter by listing type
- `amenities` (string[]): Filter by amenities (comma-separated)
- `sustainabilityFeatures` (string[]): Filter by sustainability features
- `priceRange` (string): Filter by price range ($, $$, $$$)
- `minRating` (number): Minimum rating filter (1-5)
- `search` (string): Full-text search query
- `featured` (boolean): Show only featured listings

**Response**:
```json
{
  "listings": [
    {
      "id": "listing_id",
      "title": "Eco Coworking Space",
      "slug": "eco-coworking-space",
      "listingType": "Coworking Space",
      "shortDescription": "Sustainable workspace in city center",
      "primaryImage": {
        "url": "https://cdn.sanity.io/images/...",
        "alt": "Eco coworking space interior"
      },
      "city": {
        "name": "Barcelona",
        "slug": "barcelona",
        "country": "Spain"
      },
      "rating": 4.5,
      "priceRange": "$$",
      "amenities": ["WiFi", "Coffee", "Solar Power"],
      "sustainabilityFeatures": ["100% Renewable Energy", "Zero Waste Policy"],
      "isFeatured": true
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 300,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### `POST /api/listings`

**Purpose**: Create new listing  
**Access**: `editor`, `admin`, `superAdmin` roles  
**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "title": "New Eco Venue",
  "listingType": "Cafe",
  "description": "Detailed description...",
  "shortDescription": "Brief summary",
  "city": "city_reference_id",
  "address": {
    "street": "123 Green Street",
    "city": "Barcelona",
    "country": "Spain",
    "postalCode": "08001"
  },
  "amenities": ["WiFi", "Vegan Options"],
  "sustainabilityFeatures": ["Organic Ingredients", "Compost Program"],
  "priceRange": "$",
  "website": "https://example.com"
}
```

**Response**:
```json
{
  "success": true,
  "listing": {
    "id": "new_listing_id",
    "title": "New Eco Venue",
    "slug": "new-eco-venue",
    "status": "draft"
  }
}
```

#### `GET /api/listings/[id]`

**Purpose**: Get single listing details  
**Access**: Public  
**Parameters**: `id` - Listing ID

**Response**:
```json
{
  "listing": {
    "id": "listing_id",
    "title": "Eco Coworking Space",
    "slug": "eco-coworking-space",
    "listingType": "Coworking Space",
    "description": "Full rich text description...",
    "shortDescription": "Brief summary",
    "primaryImage": {...},
    "imageGallery": [...],
    "address": {...},
    "city": {...},
    "amenities": [...],
    "sustainabilityFeatures": [...],
    "rating": 4.5,
    "reviewCount": 25,
    "website": "https://example.com",
    "openingHours": "Mon-Fri 9AM-6PM",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

#### `PUT /api/listings/[id]`

**Purpose**: Update existing listing  
**Access**: `venueOwner` (own listings), `editor`, `admin`, `superAdmin`  
**Headers**: `Authorization: Bearer <token>`

**Body**: (Same structure as POST, partial updates allowed)

**Response**:
```json
{
  "success": true,
  "listing": {
    "id": "listing_id",
    "title": "Updated Title",
    "updatedAt": "2024-12-26T00:00:00.000Z"
  }
}
```

#### `DELETE /api/listings/[id]`

**Purpose**: Delete listing  
**Access**: `moderator`, `admin`, `superAdmin`  
**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Listing deleted successfully"
}
```

---

### **City Management APIs**

#### `GET /api/cities`

**Purpose**: Retrieve cities with listings count  
**Access**: Public

**Response**:
```json
{
  "cities": [
    {
      "id": "city_id",
      "name": "Barcelona",
      "slug": "barcelona",
      "country": "Spain",
      "continent": "Europe",
      "description": "Brief city description...",
      "primaryImage": {...},
      "listingsCount": 45,
      "digitalNomadFriendliness": 4.5,
      "ecoFriendliness": 4.0,
      "costOfLiving": "Medium",
      "isFeatured": true
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
    "id": "city_id",
    "name": "Barcelona",
    "slug": "barcelona",
    "country": "Spain",
    "description": "Full city description...",
    "primaryImage": {...},
    "location": {
      "lat": 41.3851,
      "lng": 2.1734
    },
    "popularAttractions": ["Park Güell", "Sagrada Familia"],
    "digitalNomadFriendliness": 4.5,
    "ecoFriendliness": 4.0,
    "costOfLiving": "Medium"
  },
  "listings": [...]
}
```

---

### **User Management APIs**

#### `GET /api/users/profile`

**Purpose**: Get current user profile  
**Access**: Authenticated users  
**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "avatar": "https://example.com/avatar.jpg",
    "favoriteListings": ["listing_id_1", "listing_id_2"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### `PUT /api/users/profile`

**Purpose**: Update user profile  
**Access**: Authenticated users (own profile)  
**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "name": "Updated Name",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

#### `POST /api/users/favorites`

**Purpose**: Add/remove listing from favorites  
**Access**: Authenticated users  
**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "listingId": "listing_id",
  "action": "add" // or "remove"
}
```

---

### **Admin APIs**

#### `GET /api/admin/users`

**Purpose**: List all users with management capabilities  
**Access**: `admin`, `superAdmin`  
**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "users": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-12-26T00:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

#### `PUT /api/admin/users/[id]/role`

**Purpose**: Update user role  
**Access**: `superAdmin` only  
**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "role": "editor"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "role": "editor",
    "updatedAt": "2024-12-26T00:00:00.000Z"
  }
}
```

---

### **Review APIs**

#### `POST /api/listings/[id]/reviews`

**Purpose**: Create review for listing  
**Access**: Authenticated users  
**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "rating": 5,
  "title": "Amazing sustainable workspace!",
  "content": "Really impressed with their green initiatives...",
  "sustainabilityRating": 5,
  "amenitiesRating": 4
}
```

#### `GET /api/listings/[id]/reviews`

**Purpose**: Get reviews for listing  
**Access**: Public

**Response**:
```json
{
  "reviews": [
    {
      "id": "review_id",
      "rating": 5,
      "title": "Amazing sustainable workspace!",
      "content": "Really impressed...",
      "author": {
        "name": "Reviewer Name",
        "avatar": "..."
      },
      "createdAt": "2024-12-26T00:00:00.000Z"
    }
  ],
  "averageRating": 4.5,
  "totalReviews": 25
}
```

---

## 🚨 **Error Handling**

### **Standard Error Responses**

#### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "code": "AUTH_REQUIRED",
  "statusCode": 401
}
```

#### Authorization Errors
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions for this action",
  "code": "INSUFFICIENT_PERMISSIONS",
  "statusCode": 403,
  "requiredRole": "editor"
}
```

#### Validation Errors
```json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "code": "VALIDATION_FAILED",
  "statusCode": 400,
  "details": [
    {
      "field": "email",
      "message": "Valid email address is required"
    }
  ]
}
```

#### Rate Limiting
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds",
  "code": "RATE_LIMIT_EXCEEDED",
  "statusCode": 429,
  "retryAfter": 60
}
```

---

## 🔧 **Request/Response Headers**

### **Required Headers**
- **Authentication**: `Authorization: Bearer <jwt_token>`
- **Content Type**: `Content-Type: application/json`

### **Security Headers** (Automatic)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: ...`

### **Rate Limiting Headers**
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 95`
- `X-RateLimit-Reset: 1640995200`

---

## 📊 **Pagination**

### **Standard Pagination Format**

**Query Parameters**:
- `page` (number): Page number (1-based, default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

**Response Format**:
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 300,
    "itemsPerPage": 20,
    "hasNext": true,
    "hasPrev": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

---

## 🧪 **Testing the API**

### **Postman Collection**

A comprehensive Postman collection is available with:
- Pre-configured requests for all endpoints
- Environment variables for different stages
- Authentication flows and token management
- Example request/response pairs

### **cURL Examples**

#### Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Use authenticated endpoint
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create Listing
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Venue","listingType":"Cafe","city":"city_id"}'
```

---

## 🚀 **Development Setup**

### **Environment Variables**

Required in `.env.local`:

```bash
# API Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# Database
MONGODB_URI=mongodb://localhost:27017/nomads-directory

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token
```

### **Running the API**

```bash
# Development server
npm run dev

# API available at http://localhost:3000/api/*

# Test API endpoints
npm run test:api
```

---

## 🔗 **Related Documentation**

- **[Authentication & Security](../authentication-security/README.md)** - Detailed security implementation
- **[Testing Guide](../testing/README.md)** - API testing strategies
- **[Development Guide](../development/README.md)** - Local development setup
- **[Deployment Guide](../deployment/README.md)** - Production API configuration

---

**API Version**: 1.0  
**Last Updated**: December 26, 2024  
**Next Review**: March 2025