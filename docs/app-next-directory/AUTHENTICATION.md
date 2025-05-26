# 🔐 Authentication System Documentation

This document covers the **NextAuth.js authentication implementation** for the Sustainable Eco-Friendly Digital Nomads Directory application.

## ✅ **Implementation Status: COMPLETED**

The authentication system is **fully implemented and production-ready** with comprehensive testing coverage.

### **Key Features**
- ✅ **JWT Strategy**: Secure token-based authentication
- ✅ **Role-Based Access Control**: 5-tier permission system
- ✅ **MongoDB Session Management**: Persistent user sessions
- ✅ **Security**: bcryptjs password hashing, rate limiting
- ✅ **Comprehensive Testing**: 120+ E2E test cases

## 🏗️ Architecture Overview

```text
Authentication Flow:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   NextAuth.js   │    │   MongoDB       │
│   (Browser)     │────│   (JWT + RBAC)  │────│   (Sessions)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 👥 User Roles & Permissions

### **Role Hierarchy**
1. **user** - Basic authenticated user
2. **editor** - Content creation permissions
3. **venueOwner** - Venue management capabilities
4. **admin** - Administrative access
5. **superAdmin** - Full system access

### **Permission Matrix**
| Feature | user | editor | venueOwner | admin | superAdmin |
|---------|------|--------|------------|-------|------------|
| View listings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create reviews | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit content | ❌ | ✅ | Own venues | ✅ | ✅ |
| Manage venues | ❌ | ❌ | Own venues | ✅ | ✅ |
| User management | ❌ | ❌ | ❌ | ✅ | ✅ |
| System config | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🔧 Implementation Details

### **NextAuth Configuration**
**File**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Authentication logic with bcrypt
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // JWT token enrichment with user role
    },
    async session({ session, token }) {
      // Session object construction
    }
  }
}
```

### **User Model Schema**
**File**: `src/lib/mongodb/models/User.ts`

```typescript
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'editor', 'venueOwner', 'admin', 'superAdmin'],
    default: 'user'
  },
  emailVerified: { type: Date },
  image: { type: String }
}, { timestamps: true });
```

### **Route Protection Middleware**
**File**: `src/middleware.ts`

```typescript
export function middleware(request: NextRequest) {
  const token = request.nextauth.token;

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token || !['admin', 'superAdmin'].includes(token.role)) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  // Additional route protection logic
}
```

## 🚀 Usage Examples

### **Client-Side Authentication**
```typescript
import { useSession, signIn, signOut } from "next-auth/react";

function AuthComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  if (session) {
    return (
      <>
        <p>Signed in as {session.user.email}</p>
        <p>Role: {session.user.role}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }

  return (
    <>
      <p>Not signed in</p>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}
```

### **Server-Side Route Protection**
```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check role-based permissions
  if (!['admin', 'superAdmin'].includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Protected route logic
}
```

## 🧪 Testing Coverage

### **Test Suites**
- **Authentication Flow Tests** (`tests/auth.spec.ts`)
- **Role-Based Access Control** (`tests/rbac.spec.ts`)
- **API Security Tests** (`tests/auth-api.spec.ts`)

### **Test Coverage Areas**
- ✅ User registration with validation
- ✅ Login/logout functionality
- ✅ Password reset workflow
- ✅ Session persistence across browser sessions
- ✅ Role-based route protection
- ✅ API endpoint authorization
- ✅ Cross-browser compatibility
- ✅ Mobile responsive testing

### **Running Auth Tests**
```bash
# Run all authentication tests
npm run test:auth

# Run RBAC tests
npm run test:rbac

# Run API security tests
npm run test:api

# Run with UI for debugging
npm run test:ui
```

## 🔒 Security Features

### **Password Security**
- **bcryptjs hashing** with salt rounds
- **Minimum password requirements** enforced
- **Password reset** with secure tokens

### **Session Security**
- **JWT tokens** with expiration
- **Secure cookie settings** (httpOnly, secure, sameSite)
- **Session rotation** on login

### **API Security**
- **Rate limiting** on auth endpoints
- **CORS protection** configured
- **Input validation** with Zod schemas
- **SQL injection prevention** via MongoDB ODM

## 🚨 Troubleshooting

### **Common Issues**

#### **"Session callback must be provided" Error**
```typescript
// Ensure JWT strategy is configured
session: { strategy: "jwt" }
```

#### **Role not appearing in session**
```typescript
// Check JWT callback in authOptions
async jwt({ token, user }) {
  if (user) {
    token.role = user.role;
  }
  return token;
}
```

#### **MongoDB connection issues**
```typescript
// Verify MONGODB_URI in environment variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### **Debug Mode**
```bash
# Enable NextAuth debug logging
NEXTAUTH_DEBUG=true npm run dev
```

## 📚 Resources

- **NextAuth.js Documentation**: [https://next-auth.js.org/](https://next-auth.js.org/)
- **MongoDB Adapter**: [https://next-auth.js.org/adapters/mongodb](https://next-auth.js.org/adapters/mongodb)
- **JWT Configuration**: [https://next-auth.js.org/configuration/options#jwt](https://next-auth.js.org/configuration/options#jwt)

---

🔗 **Related Documentation**:
- [API Documentation](API_DOCUMENTATION.md)
- [Testing Guide](TESTING.md)
- [Development Setup](../monorepo/DEVELOPMENT_SETUP.md)
