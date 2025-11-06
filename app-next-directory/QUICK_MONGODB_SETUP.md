# 🚀 Quick MongoDB Setup for Phase 1 Integration

## Option 1: MongoDB Atlas (Recommended - Free Tier)

### Step-by-Step Setup:

1. **Visit**: https://www.mongodb.com/cloud/atlas
2. **Sign Up/Login**: Create free account
3. **Create Cluster**:
   - Choose "M0 Sandbox" (Free forever)
   - Select region closest to you
   - Cluster name: `sustainable-nomads-cluster`

4. **Database Access**:
   - Go to "Database Access" in left menu
   - Click "Add New Database User"
   - Username: `nomads-app`
   - Password: Generate secure password (save this!)
   - Database User Privileges: "Read and write to any database"

5. **Network Access**:
   - Go to "Network Access" in left menu
   - Click "Add IP Address"
   - For development: Add `0.0.0.0/0` (Allow access from anywhere)
   - For production: Add specific IP addresses

6. **Get Connection String**:
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string

### Your connection string will look like:
```
mongodb+srv://nomads-app:<password>@sustainable-nomads-cluster.xxxxx.mongodb.net/sustainable-nomads?retryWrites=true&w=majority
```

## Option 2: Local MongoDB (Development Only)

### Windows Installation:
1. Download MongoDB Community Edition from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will run as a Windows service
4. Connection string: `mongodb://localhost:27017/sustainable-nomads`

### Using Docker:
```bash
docker run --name mongodb -p 27017:27017 -d mongo:latest
```
Connection string: `mongodb://localhost:27017/sustainable-nomads`

## 🔧 Update Environment

Replace the MONGODB_URI in your `.env.local` file with your actual connection string:

```bash
# Replace this placeholder:
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/sustainable-nomads?retryWrites=true&w=majority

# With your actual connection string:
MONGODB_URI=mongodb+srv://nomads-app:YOUR_ACTUAL_PASSWORD@sustainable-nomads-cluster.xxxxx.mongodb.net/sustainable-nomads?retryWrites=true&w=majority
```

## ✅ Test Setup

After updating the MONGODB_URI, run:
```bash
npm run test:db-connection
```

## 🎯 Next Steps After Database Setup

1. ✅ Database connection working
2. 🧪 Run authentication tests: `npm run test:integration`
3. 🚀 Start development server: `npm run dev`
4. 🔍 Test authentication flows in browser
