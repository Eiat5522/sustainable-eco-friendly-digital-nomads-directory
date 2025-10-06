# 🔐 Security Quick Reference Card

**Quick reference for developers working with authentication and access control.**

---

## 🚀 **Quick Security Checklist**

### **✅ Before Adding New Protected Features**

1. **Route Protection**: Add to middleware matcher in `src/middleware.ts`
2. **Server Validation**: Use `auth()` for server-side session checking
3. **Role Check**: Validate user role using `ACCESS_CONTROL_MATRIX`
4. **API Security**: Protect API endpoints with proper authentication
5. **Error Handling**: Return appropriate 401/403 status codes
6. **Test Coverage**: Add security tests for new functionality

---

## 👥 **Role Hierarchy (Quick Reference)**

```
Level | Role           | Key Permissions
------|----------------|------------------------------------------
  5   | superAdmin     | Everything + User Role Management
  4   | admin          | Platform Management (no role changes)
  3   | moderator      | Content Moderation + Limited Admin
  2   | venueOwner     | Own Listings + User Features  
  1   | editor/content | Content Creation + Reviews
  0   | user           | Reviews + Favorites + Profile
 -1   | unidentified   | Public Content Only
```

---

## 🛡️ **Common Security Patterns**

### **1. Page Protection**
```typescript
// Server Component Protection
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/protected-route');
  }
  
  // Optional: Role check
  if (session.user.role !== 'requiredRole') {
    redirect('/dashboard');
  }
}
```

### **2. API Endpoint Protection**
```typescript
// API Route Protection
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' }, 
      { status: 401 }
    );
  }
  
  if (!hasRequiredRole(session.user.role)) {
    return NextResponse.json(
      { error: 'Access denied' }, 
      { status: 403 }
    );
  }
}
```

### **3. Client Component Protection**
```typescript
// Client Component Protection
'use client';
import { useSession } from 'next-auth/react';

export function ProtectedComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <Loading />;
  if (!session) return <LoginPrompt />;
  
  return <ProtectedContent />;
}
```

---

## 🔑 **Access Control Quick Checks**

### **Check User Role**
```typescript
import { ACCESS_CONTROL_MATRIX } from '@/types/auth';

function canUserAccess(userRole: UserRole, page: string, action: string) {
  return ACCESS_CONTROL_MATRIX[userRole]?.pages[page]?.[action] ?? false;
}

// Usage
if (canUserAccess(session.user.role, 'admin', 'canView')) {
  // Allow access
}
```

### **Admin Role Check**
```typescript
function isAdmin(role?: UserRole): boolean {
  return role === 'admin' || role === 'superAdmin';
}

function isSuperAdmin(role?: UserRole): boolean {
  return role === 'superAdmin';
}
```

---

## 🔒 **Security Headers & Middleware**

### **Add Route to Protection**
```typescript
// In src/middleware.ts
export const config = {
  matcher: [
    '/your-new-route/:path*',  // Add your route here
    // ... existing routes
  ]
};
```

### **Security Headers**
Automatically applied by middleware:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## 🧪 **Testing Security**

### **Test Authentication**
```bash
# Run security tests
pnpm test:e2e -- tests/e2e/rbac.spec.ts
pnpm test:e2e -- tests/e2e/admin-dashboard.spec.ts

# Test specific access control
pnpm test:e2e -- --grep "access control"
```

### **Manual API Testing**
```bash
# Test protected API without auth
curl http://localhost:3000/api/admin/users
# Should return 401

# Test with invalid role
curl -H "Authorization: Bearer USER_TOKEN" http://localhost:3000/api/admin/users  
# Should return 403
```

---

## 🚨 **Common Security Mistakes**

| ❌ **Don't Do** | ✅ **Do Instead** |
|----------------|-------------------|
| Only client-side auth checks | Always validate server-side |
| Trust user input | Validate and sanitize all input |
| Hardcode role checks | Use ACCESS_CONTROL_MATRIX |
| Skip error handling | Proper 401/403 responses |
| Forget callback URLs | Include callbackUrl for redirects |

---

## 📞 **Security Support**

### **Need Help?**
1. **Check**: [Full Security Documentation](SECURITY_ACCESS_CONTROL.md)
2. **Debug**: [Authentication Guide](app-next-directory/AUTHENTICATION.md)
3. **Test**: Run security test suite
4. **Ask**: Create issue with security label

### **Emergency Security Issues**
- **Document**: Create detailed issue with steps to reproduce
- **Test**: Include failing test cases
- **Environment**: Specify development vs. production
- **Impact**: Describe potential security implications

---

**🔐 Security is everyone's responsibility. When in doubt, choose the more restrictive option.**