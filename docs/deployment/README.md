# 🚀 Deployment Guide - Production Setup & Operations

**Last Updated**: December 26, 2024  
**Status**: ✅ PRODUCTION-READY DEPLOYMENT PIPELINE  
**Platforms**: Vercel (Frontend), Sanity Cloud (CMS), MongoDB Atlas (Database)

> **Consolidated from**: `docs/monorepo/DEPLOYMENT_GUIDE.md`, deployment sections from other docs

---

## 🎯 **Deployment Architecture Overview**

### **Production Infrastructure**

```text
Production Architecture:
┌─────────────────────────────────────────────────────────┐
│                    CDN & Edge Network                   │
│                   (Vercel Global CDN)                   │
├─────────────────────────────────────────────────────────┤
│                  Frontend Application                   │
│              Next.js 15+ (Vercel Platform)             │
│         • Server-Side Rendering (SSR)                  │
│         • Static Site Generation (SSG)                 │
│         • API Routes                                    │
│         • Edge Functions                               │
├─────────────────────────────────────────────────────────┤
│                 Content Management                      │
│                Sanity CMS (Cloud)                      │
│         • Content Studio                               │
│         • Content API                                  │
│         • Image CDN                                    │
│         • Real-time Updates                            │
├─────────────────────────────────────────────────────────┤
│                 Database Layer                          │
│                MongoDB Atlas (Cloud)                   │
│         • Replica Sets                                 │
│         • Automated Backups                            │
│         • Global Clusters                              │
│         • Performance Insights                         │
├─────────────────────────────────────────────────────────┤
│              Authentication & Security                  │
│         • NextAuth.js (JWT + Sessions)                │
│         • MongoDB Session Storage                      │
│         • OAuth Providers                              │
│         • RBAC Implementation                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ **Deployment Platforms**

### **1. Frontend Deployment (Vercel)**

**Platform**: Vercel  
**Repository**: Connected to GitHub for automatic deployments  
**Build Command**: `pnpm build:next`  
**Output Directory**: `app-next-directory/.next`  

#### **Vercel Configuration** (`vercel.json`)
```json
{
  "buildCommand": "cd app-next-directory && npm run build",
  "outputDirectory": "app-next-directory/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1", "fra1", "hnd1"],
  "functions": {
    "app-next-directory/src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options", 
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

#### **Environment Variables (Vercel)**
```bash
# Production Environment Variables
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=production_32_character_secret
MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/production
NEXT_PUBLIC_SANITY_PROJECT_ID=production_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=production_api_token_with_read_write
NODE_ENV=production

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=production_google_client_id
GOOGLE_CLIENT_SECRET=production_google_client_secret
# GitHub OAuth (NextAuth expects GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET)
GITHUB_CLIENT_ID=production_github_client_id
GITHUB_CLIENT_SECRET=production_github_client_secret
```

### **2. CMS Deployment (Sanity Cloud)**

**Platform**: Sanity Cloud  
**Studio URL**: `https://your-project.sanity.studio`  
**Deploy Command**: `pnpm build:sanity && pnpm deploy:sanity`

#### **Sanity Configuration** (`sanity.config.ts`)
```typescript
import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import schemas from './schemas'

export default defineConfig({
  name: 'default',
  title: 'Sustainable Digital Nomads Directory',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  
  plugins: [
    deskTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Listings')
              .child(S.documentTypeList('listing')),
            S.listItem()
              .title('Cities') 
              .child(S.documentTypeList('city')),
            // ... other content types
          ])
    }),
    visionTool({
      defaultApiVersion: '2024-01-01'
    })
  ],
  
  schema: {
    types: schemas
  }
})
```

### **3. Database Deployment (MongoDB Atlas)**

**Platform**: MongoDB Atlas  
**Cluster**: Production cluster with replica sets  
**Backup**: Automated daily backups with point-in-time recovery

#### **Database Configuration**
```javascript
// Connection configuration for production
const mongoConfig = {
  uri: process.env.MONGODB_URI,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    retryWrites: true,
    w: 'majority'
  }
}
```

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Workflow**

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.19.0'
          
      - name: Enable Corepack
        run: corepack enable
        
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Type checking
        run: pnpm types:check
        
      - name: Lint code
        run: pnpm lint
        
      - name: Run tests
        run: pnpm test
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI_TEST }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET_TEST }}
          
      - name: Build application
        run: pnpm build
        env:
          NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          SANITY_API_TOKEN: ${{ secrets.SANITY_API_TOKEN }}

  deploy-preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          
      - name: Deploy Sanity Studio
        run: |
          cd sanity
          npm run build
          npm run deploy -- --token ${{ secrets.SANITY_DEPLOY_TOKEN }}
```

### **Deployment Environments**

#### **Preview Environment** (Pull Requests)
- **URL**: Generated preview URLs for each PR
- **Purpose**: Testing changes before production
- **Database**: Separate preview database
- **CMS**: Preview dataset in Sanity

#### **Production Environment** (Main Branch)
- **URL**: Production domain
- **Database**: Production MongoDB Atlas cluster
- **CMS**: Production Sanity dataset
- **Monitoring**: Full monitoring and alerting

---

## 🔐 **Security Configuration**

### **Production Security Headers**

**File**: `app-next-directory/next.config.mjs`

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.sanity.io; frame-src 'none';"
  }
]

export default {
  // ... other config
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ]
  }
}
```

### **Environment Security**

#### **Secret Management**
```bash
# Use Vercel's secure environment variables
vercel env add NEXTAUTH_SECRET production
vercel env add MONGODB_URI production
vercel env add SANITY_API_TOKEN production

# GitHub Secrets for CI/CD
VERCEL_TOKEN
VERCEL_ORG_ID  
VERCEL_PROJECT_ID
SANITY_DEPLOY_TOKEN
MONGODB_URI_TEST
NEXTAUTH_SECRET_TEST
```

#### **API Security**
- ✅ **Rate Limiting**: Implemented on all API routes
- ✅ **Input Validation**: Zod schemas for request validation
- ✅ **Authentication**: JWT-based with secure session storage
- ✅ **Authorization**: Role-based access control (RBAC)
- ✅ **CORS**: Configured for production domains only

---

## 📊 **Monitoring & Analytics**

### **Performance Monitoring**

#### **Vercel Analytics**
```typescript
// app-next-directory/src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

#### **Custom Monitoring**
```typescript
// app-next-directory/src/lib/monitoring.ts
import { NextRequest } from 'next/server'

export function logError(error: Error, context: string) {
  console.error(`[${context}] ${error.message}`, {
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context
  })
  
  // Send to external monitoring service (e.g., Sentry, LogRocket)
  if (process.env.NODE_ENV === 'production') {
    // External error reporting
  }
}

export function logPerformance(operation: string, duration: number) {
  console.log(`[PERF] ${operation}: ${duration}ms`)
  
  // Send performance metrics to monitoring service
}
```

### **Database Monitoring**

#### **MongoDB Atlas Monitoring**
- **Performance Insights**: Query performance and index usage
- **Real-time Metrics**: Connection pooling and operation latency
- **Automated Alerting**: Database performance thresholds
- **Backup Monitoring**: Automated backup success/failure alerts

### **Application Health Checks**

#### **Health Check API** (`app-next-directory/src/app/api/health/route.ts`)
```typescript
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { sanityClient } from '@/lib/sanity'

export async function GET() {
  try {
    // Check database connectivity
    await connectToDatabase()
    
    // Check Sanity CMS connectivity
    await sanityClient.fetch('*[_type == "siteConfig"][0]')
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'operational',
        cms: 'operational',
        application: 'operational'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}
```

---

## 🔧 **Deployment Commands**

### **Manual Deployment**

```bash
# 1. Pre-deployment validation
pnpm lint                    # Code quality check
pnpm types:check            # TypeScript validation  
pnpm test                   # Run test suite
pnpm build                  # Production build

# 2. Deploy to Vercel (Frontend)
cd app-next-directory
vercel --prod               # Deploy to production

# 3. Deploy Sanity Studio (CMS)
cd sanity
npm run build
npm run deploy

# 4. Verify deployment
curl https://your-domain.com/api/health
```

### **Rollback Procedures**

```bash
# Vercel rollback (to previous deployment)
vercel rollback --url https://your-domain.com

# Database rollback (if needed)
# Use MongoDB Atlas point-in-time recovery

# Sanity rollback (to previous studio version)
cd sanity
npm run deploy -- --tag previous-version
```

---

## 🚨 **Production Troubleshooting**

### **Common Deployment Issues**

#### **1. Build Failures**
```bash
# Check build logs in Vercel dashboard
# Common causes:
# - TypeScript errors
# - Missing environment variables
# - Dependency version conflicts

# Local debugging
pnpm build 2>&1 | tee build.log
# Review build.log for specific errors
```

#### **2. Runtime Errors**
```bash
# Check Vercel function logs
vercel logs --follow

# Check specific API route logs
vercel logs /api/listings --follow

# Database connection issues
# Verify MONGODB_URI and network access
```

#### **3. Performance Issues**
```bash
# Analyze bundle size
cd app-next-directory
npm run analyze

# Check Core Web Vitals in Vercel Analytics
# Monitor database query performance in MongoDB Atlas
```

### **Debugging Tools**

#### **Production Debugging** (Limited)
```typescript
// Use conditional logging in production
if (process.env.NODE_ENV === 'production' && process.env.DEBUG_MODE === 'true') {
  console.log('Production debug info:', data)
}
```

#### **Error Boundaries**
```typescript
// app-next-directory/src/components/ErrorBoundary.tsx
'use client'

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong. Please try refreshing the page.</div>}
      onError={(error, errorInfo) => {
        // Log error to monitoring service
        logError(error, 'ErrorBoundary')
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

---

## 📈 **Performance Optimization**

### **Frontend Optimization**

#### **Next.js Configuration**
```javascript
// app-next-directory/next.config.mjs
export default {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons']
  },
  
  images: {
    domains: ['cdn.sanity.io'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30 // 30 days
  },
  
  compress: true,
  
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

#### **Database Optimization**
```javascript
// MongoDB indexes for production performance
db.listings.createIndex({ "city": 1, "listingType": 1 })
db.listings.createIndex({ "location": "2dsphere" })
db.listings.createIndex({ "amenities": 1 })
db.listings.createIndex({ "sustainabilityFeatures": 1 })
db.users.createIndex({ "email": 1 }, { unique: true })
db.sessions.createIndex({ "expires": 1 }, { expireAfterSeconds: 0 })
```

---

## 📝 **Deployment Checklist**

### **Pre-Deployment Checklist**

- [ ] **Code Quality**
  - [ ] ESLint passes without errors
  - [ ] TypeScript compilation successful
  - [ ] Prettier formatting applied
  - [ ] No console.log statements in production code

- [ ] **Testing**
  - [ ] All E2E tests pass (120+ test cases)
  - [ ] Unit tests pass with adequate coverage
  - [ ] Manual testing of critical user flows
  - [ ] Cross-browser compatibility verified

- [ ] **Environment Configuration**
  - [ ] Production environment variables configured
  - [ ] Database connections verified
  - [ ] Sanity CMS integration working
  - [ ] OAuth providers configured (if applicable)

- [ ] **Security**
  - [ ] Security headers configured
  - [ ] HTTPS enforced
  - [ ] API rate limiting enabled
  - [ ] Input validation implemented

- [ ] **Performance**
  - [ ] Bundle size optimized
  - [ ] Images optimized and properly sized
  - [ ] Database queries optimized with proper indexes
  - [ ] Caching strategies implemented

### **Post-Deployment Checklist**

- [ ] **Functionality Verification**
  - [ ] Health check endpoint responding
  - [ ] User authentication working
  - [ ] CRUD operations functional
  - [ ] Search and filtering working
  - [ ] Admin dashboard accessible

- [ ] **Performance Verification**
  - [ ] Core Web Vitals within acceptable ranges
  - [ ] Page load times under 3 seconds
  - [ ] API response times under 500ms
  - [ ] Database query performance acceptable

- [ ] **Monitoring Setup**
  - [ ] Error tracking configured
  - [ ] Performance monitoring active
  - [ ] Uptime monitoring in place
  - [ ] Backup verification completed

---

## 🔗 **Related Documentation**

- **[Development Guide](../development/README.md)** - Local development setup and workflow
- **[Authentication & Security](../authentication-security/README.md)** - Security implementation details
- **[API Documentation](../api/README.md)** - API endpoints and authentication
- **[Testing Guide](../testing/README.md)** - Testing strategies and implementation

---

## 🆘 **Emergency Procedures**

### **Incident Response**

1. **Immediate Response**
   - Check monitoring dashboards for error rates
   - Verify health check endpoint status
   - Review recent deployments and changes

2. **Rollback Procedure**
   ```bash
   # Immediate rollback to last known good version
   vercel rollback --url https://your-domain.com
   ```

3. **Communication**
   - Update status page (if available)
   - Notify stakeholders of the incident
   - Document incident details and timeline

4. **Post-Incident**
   - Conduct incident retrospective
   - Update monitoring and alerting
   - Implement preventive measures

**Deployment Status**: ✅ Production Ready  
**Last Updated**: December 26, 2024  
**Next Review**: March 2025
