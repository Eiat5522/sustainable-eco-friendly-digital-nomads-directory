# 🚀 Deployment Guide

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

   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://prod_user:password@cluster.mongodb.net/prod_db

   # NextAuth Configuration
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=your_production_secret_32_chars

   # OAuth Providers (if using)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Optional: Analytics & Monitoring
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
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
         'http://localhost:3000',
         'https://yourdomain.com',
         'https://your-vercel-domain.vercel.app'
       ]
     }
   })
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
NEXTAUTH_SECRET=64_character_production_secret_replace_this_in_production

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
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
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
     if (process.env.NODE_ENV === 'production') {
       // Send to error reporting service
       console.error('Production Error:', error, context)
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
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
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

- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Sanity schemas deployed
- [ ] SSL certificates configured
- [ ] Domain DNS configured

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

- [ ] Verify application loads correctly
- [ ] Test authentication flows
- [ ] Check database connections
- [ ] Verify Sanity content loading
- [ ] Test critical user journeys
- [ ] Monitor error rates
- [ ] Check performance metrics

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
# Check NEXTAUTH_SECRET is 32+ characters
# Verify MongoDB connection string
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
       optimizePackageImports: ['lodash', 'react-icons'],
     },
     images: {
       domains: ['cdn.sanity.io'],
       formats: ['image/webp', 'image/avif'],
     },
   }
   ```

2. **Caching Strategy:**
   ```typescript
   // API routes with caching
   export async function GET() {
     return NextResponse.json(data, {
       headers: {
         'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
       }
     })
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
