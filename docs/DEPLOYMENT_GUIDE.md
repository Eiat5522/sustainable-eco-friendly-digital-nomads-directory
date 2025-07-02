# 🚀 Deployment Guide

**Last Updated: July 2025**

This guide covers deploying the Sustainable Eco-Friendly Digital Nomads Directory to production, including admin dashboard, analytics, bulk operations, and troubleshooting.

---

## 🏗️ Architecture Overview

```
Production Architecture:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Sanity Cloud  │    │  MongoDB Atlas  │
│   (Next.js App) │────│   (CMS Hosting) │    │   (Database)    │
│   Port: 443     │    │   Port: 443     │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔧 Environment Setup

### 1. Vercel Deployment (Next.js Frontend)

#### Prerequisites

- Vercel account
- GitHub repository access
- Environment variables configured (see below)

#### Deployment Steps

1. **Connect Repository to Vercel:**
   ```bash
   npm install -g vercel
   vercel login
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
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET`
   - `SANITY_API_TOKEN`
   - `MONGODB_URI`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (if using OAuth)
   - `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NEXT_PUBLIC_POSTHOG_KEY` (analytics)
   - `ADMIN_FEATURE_FLAG_XYZ` (for admin dashboard features)
   - Add any new variables for analytics, geo-search, or admin endpoints as needed

---

### 2. Sanity CMS Deployment

1. **From `sanity` directory:**
   ```bash
   cd sanity
   npm run build
   npm run deploy
   ```

2. **Configure Production Dataset:**
   ```bash
   sanity dataset create production
   npm run deploy-graphql
   ```

3. **Set up CORS for Production** in `sanity.config.ts`:
   ```typescript
   cors: {
     credentials: true,
     origin: [
       "http://localhost:3000",
       "https://yourdomain.com",
       "https://your-vercel-domain.vercel.app",
     ],
   }
   ```

---

### 3. MongoDB Atlas Configuration

- Create production cluster and user
- Configure network access for production IPs
- Use secure credentials in environment variables

---

## 🔒 Security Configuration

- SSL/TLS via Vercel and Sanity
- Secure environment variables for all secrets
- Security headers in `next.config.ts`
- Role-based access enforced for admin endpoints

---

## 📊 Monitoring & Analytics

- Vercel Analytics and Core Web Vitals
- Error monitoring (Sentry, LogRocket, etc.)
- Admin dashboard analytics endpoints enabled

---

## 🔄 CI/CD Pipeline

- GitHub Actions workflow for build, test, and deploy
- See `.github/workflows/deploy.yml` for details

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, E2E)
- [ ] Environment variables configured for all features (admin, analytics, geo-search)
- [ ] Database migrations completed
- [ ] Sanity schemas deployed and validated
- [ ] SSL certificates and DNS configured
- [ ] Admin user accounts and roles set up
- [ ] Backups in place and tested

### Deployment Steps

1. **Code Deployment:**
   ```bash
   git push origin main
   cd app-next-directory
   vercel --prod
   ```

2. **Database Migration:**
   ```bash
   cd listings
   python run_migration.py --env=production
   ```

3. **Sanity Content Migration:**
   ```bash
   cd sanity
   npm run deploy
   ```

### Post-Deployment

- [ ] Verify production URL loads correctly
- [ ] Test all core and admin features (dashboard, analytics, moderation, geo-search)
- [ ] Monitor error rates and performance metrics
- [ ] Confirm security headers and access controls

---

## 🔧 Troubleshooting

### Common Deployment Issues

- **Build Failures**: Check Vercel logs for missing env vars, TypeScript errors, import issues
- **Authentication Issues**: Verify `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, MongoDB credentials, OAuth configs
- **Sanity Connection**: Check project ID, dataset, API token, CORS
- **Database**: Test MongoDB connection
- **Contact Form/Blog/Review API**: Check endpoint configs and permissions
- **User/Admin Dashboard**: Verify roles, permissions, and endpoint security

### Rollback Procedures

- **Vercel**: Use `vercel ls` and `vercel promote <deployment-url>`
- **MongoDB**: Use Atlas backup restore or scripts

---

## 📈 Performance Optimization

- Next.js optimizations in `next.config.ts`
- CDN image optimization via Sanity
- Caching strategies for API routes

---

## 📚 Additional Resources

- [Vercel Deployment Guide](https://vercel.com/docs)
- [Sanity Deployment](https://www.sanity.io/docs/deployment)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)
