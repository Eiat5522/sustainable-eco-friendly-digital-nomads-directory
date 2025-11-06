# MongoDB Setup Guide for Authentication

## 🗄️ Quick Setup (Free Tier)

### Option 1: MongoDB Atlas (Recommended)

1. **Create Account**: Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Cluster**: Choose "M0 Sandbox" (Free forever)
3. **Database Access**: Create a database user
   - Username: `nomads-app`
   - Password: Generate secure password
4. **Network Access**: Add IP address (0.0.0.0/0 for development)
5. **Get Connection String**:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sustainable-nomads?retryWrites=true&w=majority
   ```

### Option 2: Local MongoDB (Development)

```bash
# Install MongoDB Community Edition
# Windows: Download from https://www.mongodb.com/try/download/community
# Connection string for local:
mongodb://localhost:27017/sustainable-nomads
```

## 🔧 Environment Configuration

Update `.env.local` with your connection string:

```bash
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/sustainable-nomads?retryWrites=true&w=majority
```

## ✅ Test Connection

Run the connection test:

```bash
npm run test:db-connection
```

## 🛡️ Security Best Practices

- ✅ Use strong passwords
- ✅ Restrict IP access in production
- ✅ Enable database authentication
- ✅ Use environment variables (never commit credentials)
- ✅ Regular backups enabled

## 📊 Database Structure

The authentication system will create these collections:
- `users` - User accounts and profiles
- `accounts` - OAuth provider accounts
- `sessions` - User sessions
- `verificationtokens` - Email verification tokens

## 🚀 Ready for Testing

Once configured, the authentication system includes:
- User registration with validation
- Secure login with bcrypt
- JWT session management
- Role-based access control (5 levels)
- Comprehensive test suite (120+ scenarios)
