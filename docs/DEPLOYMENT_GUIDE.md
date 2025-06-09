# 🚀 Deployment Guide

**Last Updated: May 28, 2025**

This guide covers deploying the Sustainable Eco-Friendly Digital Nomads Directory to production environments.

## 🏗️ Architecture Overview

```text
Production Architecture:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Sanity Cloud  │    │  MongoDB Atlas  │
│   (Next.js App) │────│   (CMS Hosting) │    │   (Database)    │
│   Port: 443     │    │   Port: 443     │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Environment Setup

### 1. Vercel Deployment (Next.js Frontend)

#### Prerequisites

- Vercel account
- GitHub repository access
- Environment variables configured

#### Deployment Steps

1. **Connect Repository to Vercel:**

   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login to Vercel
   vercel login

   # Deploy from project root
   cd app-next-directory
   vercel
   ```

2. **Configure Build Settings:**

   - **Framework Preset**: Next.js
   - **Root Directory**: `app-next-directory`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

3. **Environment Variables in Vercel:**
   Go to Vercel Dashboard → Project → Settings → Environment Variables:

   ```env
   # Sanity Configuration
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your_production_token
   # Optional: Add any new tokens if specific to production admin features
   # SANITY_ADMIN_API_TOKEN=your_production_admin_token

   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://prod_user:password@cluster.mongodb.net/prod_db

   # NextAuth Configuration
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=your_production_secret_32_chars_or_longer

   # OAuth Providers (if using)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Stripe Configuration (if payments are live)
   # STRIPE_SECRET_KEY=sk_live_yourstripekey
   # NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_yourstripekey

   # Optional: Analytics & Monitoring
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   # Add any new environment variables for admin dashboard features if applicable
   # ADMIN_FEATURE_FLAG_XYZ=true
   ```

### 2. Sanity CMS Deployment

#### Deploy Sanity Studio

1. **From sanity directory:**

   ```bash
   cd sanity

   # Build and deploy studio
   npm run build
   npm run deploy
   ```

2. **Configure Production Dataset:**

   ```bash
   # Create production dataset
   sanity dataset create production

   # Deploy GraphQL API (optional)
   npm run deploy-graphql
   ```

3. **Set up CORS for Production:**
   In `sanity.config.ts`:
   ```typescript
   export default defineConfig({
     // ...existing config
     cors: {
       credentials: true,
       origin: [
         "http://localhost:3000",
         "https://yourdomain.com",
         "https://your-vercel-domain.vercel.app",
       ],
     },
   });
   ```

### 3. MongoDB Atlas Configuration

#### Production Database Setup

1. **Create Production Cluster:**

   - Log into MongoDB Atlas
   - Create new cluster or use existing
   - Configure network access for production IPs

2. **Database User Configuration:**

   ```bash
   # Create production user with appropriate permissions
   Username: prod_user
   Password: secure_production_password
   Roles: readWrite@production_db
   ```

3. **Connection String:**
   ```env
   MONGODB_URI=mongodb+srv://prod_user:password@cluster.mongodb.net/production_db?retryWrites=true&w=majority
   ```

## 🔒 Security Configuration

### SSL/TLS Setup

- **Vercel**: Automatic SSL via Let's Encrypt
- **Custom Domain**: Configure DNS records for your domain
- **Sanity**: Automatic SSL included

### Environment Security

```env
# Use different secrets for production
NEXTAUTH_SECRET=a_very_strong_and_long_random_secret_for_production_at_least_32_characters

# Use production MongoDB credentials
MONGODB_URI=mongodb+srv://prod_user:secure_password@prod-cluster.mongodb.net/

# Use production Sanity tokens
SANITY_API_TOKEN=sk_production_token_with_write_access
```

### Security Headers

Configured in `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};
```

## 📊 Monitoring & Analytics

### Performance Monitoring

1. **Vercel Analytics:**

   ```typescript
   // In app/layout.tsx
   import { Analytics } from '@vercel/analytics/react'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     )
   }
   ```

2. **Core Web Vitals Monitoring:**

   ```typescript
   // In app/layout.tsx
   import { SpeedInsights } from '@vercel/speed-insights/next'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <SpeedInsights />
         </body>
       </html>
     )
   }
   ```

### Error Monitoring

1. **Production Error Handling:**
   ```typescript
   // lib/error-reporting.ts
   export function reportError(error: Error, context?: any) {
     if (process.env.NODE_ENV === "production") {
       // Send to error reporting service
       console.error("Production Error:", error, context);
       // Could integrate with Sentry, LogRocket, etc.
     }
   }
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

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
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: app-next-directory/package-lock.json

      - name: Install dependencies
        run: |
          cd app-next-directory
          npm ci

      - name: Run tests
        run: |
          cd app-next-directory
          npm run test
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI_TEST }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET_TEST }}

      - name: Build application
        run: |
          cd app-next-directory
          npm run build
        env:
          NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          NEXT_PUBLIC_SANITY_DATASET: production
          SANITY_API_TOKEN: ${{ secrets.SANITY_API_TOKEN }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: app-next-directory
```

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally (unit, integration, e2e for new features)
- [ ] Environment variables configured and verified for Vercel, Sanity, and MongoDB (including any new ones for contact form, blog, reviews, search, user dashboard, admin tools)
- [ ] Database migrations completed (if any schema changes for new features)
- [ ] Sanity schemas deployed and validated (including any new schemas for blog, reviews, or admin-managed content)
- [ ] SSL certificates configured and active
- [ ] Domain DNS configured and propagated
- [ ] All third-party service accounts (e.g., email provider for contact form, payment gateway if applicable) are set up for production.
- [ ] Admin user accounts created and roles configured for new admin dashboard.
- [ ] Backup procedures for database and CMS content are in place and tested.
- [ ] Review and confirm `.env.production` or Vercel environment variables are complete and correct.

### Deployment Steps

1. **Code Deployment:**

   ```bash
   # Push to main branch
   git push origin main

   # Or manual Vercel deployment
   cd app-next-directory
   vercel --prod
   ```

2. **Database Migration:**

   ```bash
   # Run any necessary migrations
   cd listings
   python run_migration.py --env=production
   ```

3. **Sanity Content Migration:**
   ```bash
   cd sanity
   npm run deploy
   ```

### Post-Deployment

- [ ] Verify application loads correctly on the production URL.
- [ ] **Core Functionality Testing:**
  - [ ] Test user registration and login flows.
  - [ ] Test main search functionality (including new geo-search and advanced filters).
  - [ ] Test listing submissions (if applicable) and display.
  - [ ] Test contact form submission and verify receipt (e.g., email notification).
  - [ ] Test blog API (fetching posts, individual post).
  - [ ] Test review system (submitting reviews, viewing reviews).
- [ ] **User Dashboard Testing:**
  - [ ] Verify user can access their dashboard.
  - [ ] Test user profile updates.
  - [ ] Test favorite listings functionality.
  - [ ] Test management of user-submitted content (if applicable).
- [ ] **Admin Dashboard Testing (Critical):**
  - [ ] Verify admin login and access to admin dashboard.
  - [ ] Test review moderation tools.
  - [ ] Test search statistics display.
  - [ ] Test user analytics display (if implemented).
  - [ ] Test bulk action tools for listings.
  - [ ] Test any content moderation tools.
- [ ] Check database connections are stable and queries are performing as expected.
- [ ] Verify Sanity content is loading correctly and Studio is accessible for content management.
- [ ] Test critical user journeys end-to-end (e.g., finding a listing, contacting owner, leaving a review).
- [ ] Monitor error rates via Vercel logs or integrated error monitoring service.
- [ ] Check performance metrics (Core Web Vitals, API response times) via Vercel Analytics or other tools.
- [ ] Verify security headers are correctly implemented.
- [ ] Perform a quick accessibility check on key pages.

## 🔧 Troubleshooting

### Common Deployment Issues

#### 1. Build Failures

```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Import path issues
```

#### 2. Authentication Issues

```bash
# Verify NEXTAUTH_URL matches domain
# Check NEXTAUTH_SECRET is a strong, unique production value (at least 32 characters)
# Verify MongoDB connection string and credentials
# Check OAuth provider configurations (Redirect URIs, client secrets)
```

#### 3. Sanity Connection Issues

```bash
# Verify project ID and dataset
# Check API token permissions
# Verify CORS configuration
```

#### 4. Database Connection Issues

```bash
# Test MongoDB connection
node -e "
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
client.connect().then(() => console.log('Connected')).catch(console.error);
"
```

#### 5. Contact Form Issues

```bash
# Check environment variables for email service (if used)
# Verify API endpoint for form submission is active
# Check serverless function logs (Vercel) for errors during submission
```

#### 6. Blog/Review API Issues

```bash
# Ensure Sanity dataset and project ID are correct
# Check Sanity API token permissions (read access for public, write for submissions if direct)
# Verify API routes are correctly defined and deployed
```

#### 7. User Dashboard Issues

```bash
# Check authentication state and session handling
# Verify API endpoints for user-specific data are secured and functioning
# Inspect browser console for client-side errors
```

#### 8. Admin Dashboard Issues

```bash
# Ensure admin roles and permissions are correctly configured in NextAuth/database
# Verify API endpoints for admin functions are secured and require admin privileges
# Check for errors in API responses for admin-specific data or actions
# Confirm any specific environment variables for admin features are set
```

### Rollback Procedures

#### Vercel Rollback

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

#### Database Rollback

```bash
# Use MongoDB Atlas backup restore
# Or restore from backup scripts
```

## 📈 Performance Optimization

### Production Optimizations

1. **Next.js Optimizations:**

   ```typescript
   // next.config.ts
   const nextConfig = {
     experimental: {
       optimizeCss: true,
       optimizePackageImports: ["lodash", "react-icons"],
     },
     images: {
       domains: ["cdn.sanity.io"],
       formats: ["image/webp", "image/avif"],
     },
   };
   ```

2. **Caching Strategy:**
   ```typescript
   // API routes with caching
   export async function GET() {
     return NextResponse.json(data, {
       headers: {
         "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
       },
     });
   }
   ```

### CDN Configuration

- **Images**: Served via Sanity CDN with automatic optimization
- **Static Assets**: Served via Vercel Edge Network
- **API Responses**: Cached at edge locations

## 📚 Additional Resources

- [Vercel Deployment Guide](https://vercel.com/docs)
- [Sanity Deployment](https://www.sanity.io/docs/deployment)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)
