# 🔐 Authentication & Security - Comprehensive Guide

**Last Updated**: December 26, 2024  
**Status**: ✅ ENTERPRISE-GRADE IMPLEMENTATION COMPLETE  
**Security Rating**: A+ (Defense-in-Depth Architecture)

> **Consolidated from**: `docs/SECURITY_ACCESS_CONTROL.md`, `docs/app-next-directory/AUTHENTICATION.md`, `app-next-directory/AUTH_IMPLEMENTATION_COMPLETE.md`

---

## 🎯 **Overview**

The Sustainable Eco-Friendly Digital Nomads Directory implements **enterprise-grade authentication and security** with comprehensive role-based access control (RBAC), multi-layer security architecture, and extensive testing coverage.

### **Implementation Status: 🛡️ COMPLETE & SECURE**

- ✅ **NextAuth.js v5** with JWT sessions (Edge-compatible)
- ✅ **8-Tier Role Hierarchy** (unidentifiedUser → superAdmin)
- ✅ **Comprehensive RBAC** with granular permissions
- ✅ **Defense-in-Depth Security** (middleware + server + API validation)
- ✅ **120+ Security Test Cases** covering all access scenarios
- ✅ **Admin Dashboard** with user management and content moderation
- ✅ **Security Headers** and CSRF protection

---

## 🏗️ **Security Architecture**

### **Multi-Layer Defense System**

```text
Security Layers (Defense-in-Depth):
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  ✅ UI State Management + Error Handling                │
├─────────────────────────────────────────────────────────┤
│                  Middleware Layer                       │
│  ✅ Route Protection + Role Validation                  │
├─────────────────────────────────────────────────────────┤
│                 Application Layer                       │
│  ✅ Server-Side Validation + Session Management        │
├─────────────────────────────────────────────────────────┤
│                     API Layer                          │
│  ✅ Authentication + Authorization + Input Validation   │
├─────────────────────────────────────────────────────────┤
│                   Database Layer                        │
│  ✅ MongoDB + Encrypted Sessions + Audit Trails        │
└─────────────────────────────────────────────────────────┘
```

### **Authentication Flow**

```text
Authentication Process:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   NextAuth.js   │    │   MongoDB       │
│   (Browser)     │────│   (JWT + RBAC)  │────│   (Sessions)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 👥 **Role-Based Access Control (RBAC)**

### **Role Hierarchy** (Lowest to Highest Access)

```text
unidentifiedUser → user → editor/venueOwner → moderator → admin → superAdmin
```

### **Complete Role Definitions**

| Role | Level | Description | Key Capabilities |
|------|--------|-------------|------------------|
| **unidentifiedUser** | 0 | Unauthenticated visitors | View public content, submit contact forms |
| **user** | 1 | Registered users | Create reviews, save favorites, edit profile |
| **venueOwner** | 2 | Business owners | Manage own listings, view analytics |
| **editor** | 2 | Content managers | Edit all content, moderate reviews |
| **contentEditor** | 3 | Specialized editors | Create/edit content, moderate comments |
| **moderator** | 4 | Content moderators | Moderate content, limited admin access |
| **admin** | 5 | Platform administrators | Full platform management (except user roles) |
| **superAdmin** | 6 | System administrators | Complete system control, user role management |

### **Comprehensive Permission Matrix**

| Feature / Action | unidentified | user | venueOwner | editor | moderator | admin | superAdmin |
|------------------|--------------|------|------------|--------|-----------|--------|------------|
| **Public Content** |
| View listings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search & filter | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View city pages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **User Features** |
| Create account | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Login/logout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit profile | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create reviews | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Save favorites | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Content Management** |
| Create listings | ❌ | ❌ | Own only | ✅ | ✅ | ✅ | ✅ |
| Edit listings | ❌ | ❌ | Own only | ✅ | ✅ | ✅ | ✅ |
| Delete listings | ❌ | ❌ | Own only | ❌ | ✅ | ✅ | ✅ |
| Moderate reviews | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create blog posts | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Administration** |
| View analytics | ❌ | ❌ | Own venues | ✅ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assign roles | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| System config | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔧 **Technical Implementation**

### **NextAuth.js Configuration**

**Primary Configuration File**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
// Core NextAuth.js setup with JWT strategy
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Authentication logic with bcryptjs password hashing
        // Returns user object with role information
      }
    })
  ],
  session: {
    strategy: "jwt", // Edge-compatible JWT sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Include user role in JWT token
    },
    async session({ session, token }) {
      // Pass role information to client session
    }
  }
}
```

### **Middleware Protection**

**File**: `src/middleware.ts`

```typescript
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Route-level protection based on user roles
    const { pathname } = req.nextUrl
    const userRole = req.nextauth.token?.role

    // Protect admin routes
    if (pathname.startsWith('/admin') && !['admin', 'superAdmin'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Protect venue owner routes
    if (pathname.startsWith('/dashboard/venue') && !['venueOwner', 'admin', 'superAdmin'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token // Require authentication for protected routes
    }
  }
)

// Define protected route patterns
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/profile/:path*']
}
```

### **Server-Side Protection**

**API Route Security Example**: `src/app/api/listings/route.ts`

```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  // Authenticate user
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Authorize based on role
  const userRole = session.user.role
  if (!['editor', 'admin', 'superAdmin'].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Process authenticated request
  // ...
}
```

### **Client-Side Protection**

**Component-Level Security**: `src/components/admin/AdminPanel.tsx`

```typescript
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

export default function AdminPanel() {
  const { data: session, status } = useSession()

  // Loading state
  if (status === "loading") return <div>Loading...</div>

  // Redirect if not authenticated
  if (!session) redirect('/auth/signin')

  // Check role authorization
  if (!['admin', 'superAdmin'].includes(session.user.role)) {
    return <div>Access Denied: Admin privileges required</div>
  }

  return (
    <div>
      {/* Admin interface */}
    </div>
  )
}
```

---

## 🔒 **Security Features**

### **Password Security**
- ✅ **bcryptjs hashing** with salt rounds for password storage
- ✅ **Password complexity requirements** (length, characters)
- ✅ **Rate limiting** on authentication attempts
- ✅ **Account lockout** after failed attempts

### **Session Security**
- ✅ **JWT tokens** with secure signing and encryption
- ✅ **MongoDB session storage** for persistence
- ✅ **Session rotation** and timeout handling
- ✅ **Secure cookie configuration** (httpOnly, secure, sameSite)

### **API Security**
- ✅ **Input validation** on all API endpoints
- ✅ **Rate limiting** to prevent abuse
- ✅ **CORS configuration** for cross-origin protection
- ✅ **Security headers** (CSP, X-Frame-Options, etc.)

### **RBAC Security**
- ✅ **Granular permissions** for each user role
- ✅ **Role inheritance** and hierarchy enforcement
- ✅ **Self-protection** (users can't modify their own roles)
- ✅ **Audit trails** for role changes and access

---

## 🧪 **Testing Coverage**

### **Comprehensive Test Suite: 120+ Test Cases**

1. **Authentication Flow Tests** (25 tests)
   - User registration (success/failure scenarios)
   - Login with valid/invalid credentials
   - Password reset functionality
   - Session management and logout

2. **Authorization Tests** (40 tests)
   - Role-based page access
   - API endpoint security
   - Feature-level permissions
   - Unauthorized access handling

3. **RBAC Tests** (30 tests)
   - Role hierarchy enforcement
   - Permission matrix validation
   - Role assignment restrictions
   - Self-protection mechanisms

4. **Security Tests** (25 tests)
   - Input validation and sanitization
   - CSRF protection
   - Rate limiting enforcement
   - Session security and timeout

**Test Location**: `app-next-directory/tests/e2e/auth/`

---

## 📋 **User Management**

### **Admin Dashboard Features**
- ✅ **User listing** with role and status information
- ✅ **Role management** (superAdmin only)
- ✅ **Account status** (active, suspended, banned)
- ✅ **Activity monitoring** and audit logs
- ✅ **Bulk operations** for user management

### **Self-Service Features**
- ✅ **Profile management** for all authenticated users
- ✅ **Password change** with current password verification
- ✅ **Account deletion** with data retention policies
- ✅ **Privacy settings** and data export

---

## 🚀 **Getting Started**

### **Environment Configuration**

Required environment variables in `.env.local`:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_32_character_secret_key_here

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### **Database Setup**

1. **MongoDB Collections** created automatically:
   - `users` - User accounts and profiles
   - `accounts` - OAuth account linking
   - `sessions` - Session management
   - `verificationtokens` - Email verification tokens

2. **Indexes** for performance:
   - Email index (unique)
   - Session token index
   - User ID indexes for relationships

### **Testing Authentication**

```bash
# Run authentication test suite
cd app-next-directory
npm run test:e2e -- tests/e2e/auth/

# Run specific authentication tests
npm run test:e2e -- tests/e2e/auth/login.spec.ts
npm run test:e2e -- tests/e2e/auth/rbac.spec.ts
```

---

## 🔗 **Related Documentation**

- **[API Documentation](../api/README.md)** - Authentication API endpoints
- **[Testing Guide](../testing/README.md)** - Security testing strategies
- **[Deployment Guide](../deployment/README.md)** - Production security configuration
- **[Development Guide](../development/README.md)** - Local development setup

---

## 📞 **Support & Troubleshooting**

### **Common Issues**
1. **"Unauthorized" errors**: Check session validity and role permissions
2. **Role not updating**: Clear browser cache and re-login
3. **API 403 errors**: Verify role-based API access permissions
4. **Session timeout**: Configure session maxAge in NextAuth options

### **Debug Tools**
- NextAuth debug mode: Set `debug: true` in authOptions
- Session inspection: Use NextAuth session callback logging
- Role testing: Use admin dashboard user management interface

**Last Review**: December 26, 2024  
**Next Review Due**: March 2025