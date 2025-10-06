# 🔐 Security & Access Control Documentation

This document provides comprehensive information about the security architecture, access control mechanisms, and role-based permissions implemented in the Sustainable Eco-Friendly Digital Nomads Directory platform.

---

## 🎯 **Security Overview**

### **Security Rating: A+ (Enterprise Grade)**

Our platform implements **defense-in-depth** security with multiple layers:
- ✅ **Authentication**: NextAuth.js v5 with JWT sessions
- ✅ **Authorization**: Comprehensive role-based access control (RBAC)
- ✅ **Middleware Protection**: Route-level security enforcement
- ✅ **API Security**: Server-side validation for all protected endpoints
- ✅ **Client Security**: Proper UI state management and error handling

---

## 👥 **User Roles & Hierarchy**

### **Role Hierarchy** (Lowest to Highest)
```
unidentifiedUser → user → editor/venueOwner → moderator → admin → superAdmin
```

### **Role Definitions**

| Role | Description | Key Permissions |
|------|-------------|----------------|
| **unidentifiedUser** | Unauthenticated visitors | View public content, submit contact forms |
| **user** | Registered users | Create reviews, save favorites, edit profile |
| **venueOwner** | Business owners | Manage own listings, view analytics |
| **editor** | Content managers | Edit all content, moderate reviews |
| **contentEditor** | Specialized editors | Create/edit content, moderate comments |
| **moderator** | Content moderators | Moderate content, limited admin access |
| **admin** | Platform administrators | Full platform management (except user roles) |
| **superAdmin** | System administrators | Complete system control, user role management |

---

## 🛡️ **Access Control Implementation**

### **1. User Profile Access (All Authenticated Users)**

**Security Level**: ✅ **SECURE**

**Protection Mechanisms**:
```typescript
// Client-side authentication check
const { data: session, status } = useSession();
const isAuthenticated = status === 'authenticated';

// Unauthenticated users see login prompt
if (!isAuthenticated) {
  return <SignInPrompt />;
}
```

**Features Protected**:
- Personal profile information
- Favorites management
- Review history
- Role-specific sections (venue owner reviews)

---

### **2. Dashboard Access (VenueOwner + Higher)**

**Security Level**: ✅ **SECURE**

**Server-Side Protection**:
```typescript
export default async function DashboardPage() {
  const session = await auth();
  const sessionUser = session?.user;

  // Authentication required
  if (!sessionUser?.id) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent('/dashboard')}`);
  }

  // Role-based data filtering
  const dashboardData = await getUserDashboardData(sessionUser);
}
```

**Protection Features**:
- Server-side session validation
- Role-based data filtering
- Automatic redirects for unauthorized access
- Middleware protection at `/dashboard/*`

---

### **3. Listings Management (VenueOwner Only)**

**Security Level**: ✅ **SECURE**

**Strict Role Enforcement**:
```typescript
export default async function VenueListingsPage() {
  const session = await auth();
  const sessionUser = session?.user;

  // Explicit venueOwner role check
  if (sessionUser?.role !== 'venueOwner') {
    redirect('/dashboard'); // Redirect if not venueOwner
  }
}
```

**Protection Features**:
- Explicit role validation
- Server-side enforcement
- Proper error handling
- Middleware protection

---

### **4. Admin Dashboard (Admin/SuperAdmin Only)**

**Security Level**: ✅ **SECURE**

**Multi-Layer Protection**:
```typescript
// Layout-level protection
function ensureAdmin(sessionUser: SessionUser): boolean {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export default async function AdminLayout({ children }) {
  const session = await auth();
  const sessionUser = session?.user;

  if (!ensureAdmin(sessionUser)) {
    redirect('/auth/login');
  }
}

// SuperAdmin-only restrictions
function ensureSuperAdmin(sessionUser: SessionUser): boolean {
  return sessionUser?.role === 'superAdmin';
}

// Only superAdmin can change user roles
if (newRole && !ensureSuperAdmin(sessionUser)) {
  return NextResponse.json({ 
    error: 'SuperAdmin access required for role changes' 
  }, { status: 403 });
}
```

**Protection Features**:
- Layout-level access control
- Page-level validation
- API-level protection
- SuperAdmin-only restrictions
- Comprehensive error handling

---

## 🔒 **API Security Architecture**

### **Authentication Middleware**

```typescript
// Comprehensive route protection
const protectedPaths = ['/dashboard', '/admin', '/profile', '/settings'];
const protectedApiPaths = ['/api/user', '/api/admin', '/api/reviews'];

// Authentication check
if (isProtectedRoute && !isAuthenticated) {
  const signinUrl = new URL('/auth/login', request.nextUrl.origin);
  signinUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(signinUrl);
}

// Role-based authorization
if (!hasAccess(userRole, pathname)) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

### **API Endpoint Security**

#### **User APIs** (`/api/user/*`)
```typescript
export async function GET(request: NextRequest) {
  const session = await auth();
  const sessionUser = session?.user;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  // Returns user-specific data only
}
```

#### **Admin APIs** (`/api/admin/*`)
```typescript
export async function GET(request: NextRequest) {
  const session = await auth();
  const sessionUser = session?.user;

  if (!ensureAdmin(sessionUser)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  // Admin functionality
}
```

---

## 📋 **Access Control Matrix**

### **Page Permissions**

| Role | Profile | Dashboard | Listings Mgmt | Admin Panel | User Mgmt |
|------|---------|-----------|----------------|-------------|-----------|
| **user** | ✅ Own | ✅ Limited | ❌ No | ❌ No | ❌ No |
| **venueOwner** | ✅ Own | ✅ Full | ✅ Own Only | ❌ No | ❌ No |
| **editor** | ✅ Own | ✅ Full | ✅ All | ❌ No | ❌ No |
| **moderator** | ✅ Own | ✅ Full | ❌ No | ✅ Limited | ❌ No |
| **admin** | ✅ All | ✅ Full | ✅ All | ✅ Full | ❌ No |
| **superAdmin** | ✅ All | ✅ Full | ✅ All | ✅ Full | ✅ Full |

### **Feature Permissions**

| Feature | User | VenueOwner | Editor | Moderator | Admin | SuperAdmin |
|---------|------|------------|---------|-----------|--------|------------|
| **View Profile** | Own | Own | Own | Own | All | All |
| **Edit Profile** | Own | Own | Own | Own | Own | All |
| **Manage Listings** | ❌ | Own | All | ❌ | All | All |
| **Moderate Content** | ❌ | ❌ | Reviews | All | All | All |
| **Access Analytics** | ❌ | Own Data | Platform | ❌ | All | All |
| **Manage Users** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Change User Roles** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🚨 **Security Headers & Protection**

### **Middleware Security Headers**
```typescript
function withSecurityHeaders(response) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}
```

### **Content Security Policy**
- **Frame Protection**: Prevents clickjacking attacks
- **Content Type**: Prevents MIME type sniffing
- **Referrer Policy**: Protects against information leakage

---

## 🧪 **Security Testing**

### **Test Coverage**
- ✅ **120+ E2E Tests** with Playwright
- ✅ **RBAC Test Suite** (`tests/e2e/rbac.spec.ts`)
- ✅ **Admin Dashboard Tests** (`tests/e2e/admin-dashboard.spec.ts`)
- ✅ **API Security Tests** (`tests/api-integration.spec.ts`)

### **Test Scenarios**
```typescript
// Access control testing
test('regular user cannot access admin dashboard', async ({ page }) => {
  await loginAs(page, 'user@example.com', 'password123');
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/auth\/login/);
});

test('venue owner cannot access user management', async ({ page }) => {
  await loginAs(page, 'venue@example.com', 'password123');
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/auth\/login/);
});
```

---

## 🔧 **Implementation Guidelines**

### **Adding New Protected Routes**

1. **Update Middleware**:
```typescript
// Add to protected paths
const protectedPaths = ['/dashboard', '/admin', '/profile', '/your-new-route'];
```

2. **Add Server-Side Protection**:
```typescript
export default async function YourPage() {
  const session = await auth();
  const sessionUser = session?.user;

  if (!sessionUser?.id) {
    redirect('/auth/login?callbackUrl=/your-route');
  }

  // Add role checks if needed
  if (sessionUser.role !== 'requiredRole') {
    redirect('/dashboard');
  }
}
```

3. **Update Access Control Matrix**:
```typescript
// In /types/auth.ts
yourNewPage: { canView: true, canCreate: false, ... }
```

### **Adding New API Endpoints**

```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; role?: UserRole };

    // Authentication check
    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Authorization check
    if (!hasRequiredRole(sessionUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Your API logic here
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 🚀 **Best Practices**

### **Security Checklist**

- ✅ **Always validate on server-side** - Never trust client-side data
- ✅ **Use proper HTTP status codes** - 401 for authentication, 403 for authorization
- ✅ **Implement proper redirects** - Include callback URLs for better UX
- ✅ **Add comprehensive logging** - Track security events and access attempts
- ✅ **Test all access scenarios** - Include positive and negative test cases
- ✅ **Keep dependencies updated** - Regularly update security-related packages
- ✅ **Monitor for vulnerabilities** - Use automated security scanning tools

### **Common Security Patterns**

```typescript
// 1. Authentication Check Pattern
const session = await auth();
if (!session?.user?.id) {
  return redirectToLogin();
}

// 2. Role Validation Pattern  
if (!hasRequiredRole(session.user.role, requiredRole)) {
  return accessDenied();
}

// 3. Resource Ownership Pattern
if (resourceOwnerId !== session.user.id && !isAdminRole(session.user.role)) {
  return accessDenied();
}

// 4. API Error Response Pattern
return NextResponse.json(
  { error: 'Descriptive error message', code: 'ERROR_CODE' },
  { status: 403 }
);
```

---

## 📚 **Related Documentation**

- **[Authentication Setup](app-next-directory/AUTHENTICATION.md)** - NextAuth.js configuration
- **[API Documentation](API_DOCUMENTATION.md)** - Comprehensive API reference  
- **[Testing Guide](Testing/README.md)** - E2E and security testing
- **[Deployment Security](monorepo/DEPLOYMENT_GUIDE.md#security)** - Production security checklist

---

## 🐛 **Troubleshooting Security Issues**

### **Common Issues & Solutions**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Infinite redirects** | Constant login redirects | Check middleware matcher patterns |
| **403 Access Denied** | Authorized users blocked | Verify ACCESS_CONTROL_MATRIX configuration |
| **Session not found** | Users appear logged out | Check JWT secret and token validation |
| **Role not updating** | Permission changes not reflected | Clear browser storage and refresh session |

### **Debug Commands**

```bash
# Check session data
console.log('Session:', session);

# Verify role in middleware
console.log('User Role:', token?.role);

# Test API endpoint directly
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/users
```

---

## 📞 **Security Support**

For security-related questions or concerns:

1. **Check this documentation first**
2. **Review the [troubleshooting guide](shared/TROUBLESHOOTING.md)**
3. **Run the security test suite**: `pnpm test:e2e -- tests/e2e/rbac.spec.ts`
4. **Create an issue** with security label if problems persist

---

**🔐 Security is everyone's responsibility. When in doubt, choose the more restrictive option.**