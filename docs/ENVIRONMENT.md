# Environment Configuration Guide

This guide explains all environment variables required to run the Sustainable Eco-Friendly Digital Nomads Directory project.

## 📁 Environment Files Structure

The project uses separate environment files for each workspace:

```
sustainable-eco-friendly-digital-nomads-directory/
├── .env.example                 # Template file (this repo)
├── app-next-directory/
│   └── .env.local              # Next.js app configuration
└── sanity/
    └── .env.local              # Sanity Studio configuration
```

## 🚀 Quick Setup

1. **Copy the template:**
   ```bash
   cp .env.example app-next-directory/.env.local
   cp .env.example sanity/.env.local
   ```

2. **Configure required variables** (see sections below)

3. **Test configuration:**
   ```bash
   cd app-next-directory
   npm run test:db-connection
   ```

## 🔧 Required Environment Variables

### Core Configuration (Required for Basic Functionality)

#### **Database Connection**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sustainable-nomads?retryWrites=true&w=majority
```
- **Required for**: User authentication, session storage
- **Setup**: See [MongoDB Setup Guide](../app-next-directory/MONGODB_SETUP.md)
- **Free option**: MongoDB Atlas M0 cluster

#### **Authentication**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_32_character_secret_key_here
```
- **Required for**: User authentication and sessions
- **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`
- **Production**: Update NEXTAUTH_URL to your domain

#### **Content Management (Sanity)**
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_api_token_here
```
- **Required for**: Content management, listings data
- **Setup**: Create account at [sanity.io](https://sanity.io)
- **Token**: Generate in Sanity Studio dashboard

## 🎛️ Optional Environment Variables

### OAuth Providers
```env
# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth (Optional)  
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
```
- **Purpose**: Social login options
- **Setup**: Configure in respective provider consoles

### Email Service
```env
# SMTP Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```
- **Purpose**: Transactional emails, notifications
- **Gmail**: Use app passwords, not account password

### Analytics & Payments
```env
# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Stripe Payment Processing (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_public_key
```

### Development/Debug
```env
# Development Settings
NODE_ENV=development
DEBUG=true
```

## 🏢 Workspace-Specific Configuration

### Next.js App (`app-next-directory/.env.local`)
**Required:**
- `MONGODB_URI`
- `NEXTAUTH_URL` 
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`

**Optional:**
- OAuth providers
- Email configuration
- Analytics
- Payment processing

### Sanity Studio (`sanity/.env.local`)
**Required:**
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_API_TOKEN`

## 🛡️ Security Best Practices

### Secret Management
1. **Never commit `.env.local` files** (already in `.gitignore`)
2. **Use strong secrets**: Minimum 32 characters for `NEXTAUTH_SECRET`
3. **Rotate secrets regularly** in production
4. **Use environment-specific values** (dev vs prod)

### Production Deployment
```env
# Production overrides
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
DEBUG=false
```

### MongoDB Security
1. **Restrict IP access** in MongoDB Atlas
2. **Use strong passwords** for database users
3. **Enable database authentication**
4. **Regular security updates**

## 🧪 Testing Configuration

### Database Connection Test
```bash
cd app-next-directory
npm run test:db-connection
```

Expected output:
```
🔧 Testing Database Connection...
✅ MONGODB_URI: Configured
✅ Connection successful
```

### Integration Tests
```bash
cd app-next-directory
npm run test:integration
```

## 🚨 Troubleshooting

### Common Issues

#### **MONGODB_URI Connection Failed**
```
❌ Error: MONGODB_URI not configured
```
**Solution:** Check MongoDB setup guide, verify connection string format

#### **NEXTAUTH_SECRET Missing**
```
❌ Error: NEXTAUTH_SECRET not configured  
```
**Solution:** Generate secret with `openssl rand -base64 32`

#### **Sanity Project Not Found**
```
❌ Error: Sanity project not found
```
**Solution:** Verify `NEXT_PUBLIC_SANITY_PROJECT_ID` and dataset name

### Environment Variable Validation

The app includes built-in validation that checks for required variables on startup:

```bash
# Check current environment status
cd app-next-directory
npm run setup:env
```

## 📚 Related Documentation

- [MongoDB Setup Guide](../app-next-directory/MONGODB_SETUP.md)
- [Development Setup](./monorepo/DEVELOPMENT_SETUP.md) 
- [Onboarding Guide](./ONBOARDING.md)
- [Workspace Guide](./monorepo/WORKSPACE_GUIDE.md)

## 🔗 External Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Sanity.io Documentation](https://www.sanity.io/docs)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)