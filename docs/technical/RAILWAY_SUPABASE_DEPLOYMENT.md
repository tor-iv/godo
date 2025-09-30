# Railway + Supabase Deployment Guide

## Overview

This guide covers deploying your FastAPI backend to Railway while using Supabase for database and authentication services.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │───▶│   Railway API   │───▶│   Supabase DB   │
│   Frontend      │    │   (FastAPI)     │    │   (PostgreSQL)  │
│   (Expo)        │    │   + Redis       │    │   + Auth        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project:
   - **Name**: `godo-production` (or your choice)
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users
   - **Pricing**: Free tier for development

### 1.2 Configure Database

1. **Get Connection Details**:
   ```
   Project Settings → Database → Connection string
   ```

2. **Copy these values**:
   - `SUPABASE_URL`: https://your-project.supabase.co
   - `SUPABASE_ANON_KEY`: eyJ... (anon/public key)
   - `SUPABASE_SERVICE_KEY`: eyJ... (service_role/secret key)
   - `DATABASE_URL`: postgresql://postgres:[password]@[host]:5432/postgres

### 1.3 Run Database Migrations

1. **Option A: Supabase Dashboard**:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of your migration files:
     - `backend/database/migrations/001_initial_schema.sql`
     - `backend/database/migrations/002_sample_data.sql`
     - `backend/database/migrations/003_indexes.sql`
   - Run each migration in order

2. **Option B: Local psql** (if you have it):
   ```bash
   # Connect to Supabase
   psql "postgresql://postgres:[password]@[host]:5432/postgres"

   # Run migrations
   \i backend/database/migrations/001_initial_schema.sql
   \i backend/database/migrations/002_sample_data.sql
   \i backend/database/migrations/003_indexes.sql
   ```

### 1.4 Enable Row Level Security (RLS)

In Supabase SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- Basic policies (customize as needed)
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own swipes" ON swipes
  FOR ALL USING (auth.uid() = user_id);
```

## 🚀 Part 2: Railway Deployment

### 2.1 Install Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### 2.2 Prepare Your Backend for Deployment

1. **Create `railway.json`** in your backend directory:
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
       "healthcheckPath": "/health",
       "healthcheckTimeout": 100,
       "restartPolicyType": "ON_FAILURE"
     }
   }
   ```

2. **Update `requirements.txt`** (if needed):
   ```txt
   fastapi==0.104.1
   uvicorn==0.24.0
   supabase==2.0.0
   redis==5.0.1
   python-multipart==0.0.6
   python-jose[cryptography]==3.3.0
   passlib[bcrypt]==1.7.4
   pydantic-settings==2.0.3
   httpx==0.25.2
   celery==5.3.4
   python-dotenv==1.0.0
   ```

3. **Create `Procfile`** (optional, Railway auto-detects):
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### 2.3 Deploy to Railway

1. **Initialize Railway project**:
   ```bash
   cd backend
   railway init
   # Choose "Create new project"
   # Name: godo-backend
   ```

2. **Add Redis addon**:
   ```bash
   railway add redis
   ```

3. **Set environment variables**:
   ```bash
   # Set all your environment variables
   railway variables set SUPABASE_URL=https://your-project.supabase.co
   railway variables set SUPABASE_KEY=eyJ...your-anon-key
   railway variables set SUPABASE_SERVICE_KEY=eyJ...your-service-key
   railway variables set DATABASE_URL=postgresql://postgres:password@host:5432/postgres
   railway variables set JWT_SECRET=your-super-secret-jwt-key-here
   railway variables set DEBUG=false

   # Railway automatically sets:
   # - REDIS_URL (from Redis addon)
   # - PORT (for the web service)
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Get your deployment URL**:
   ```bash
   railway domain
   # Returns something like: https://godo-backend-production.up.railway.app
   ```

### 2.4 Verify Deployment

Test your deployed API:

```bash
# Health check
curl https://your-app.up.railway.app/health

# API documentation
open https://your-app.up.railway.app/docs
```

## 🚀 Part 3: Frontend Integration

### 3.1 Update Frontend Configuration

1. **Update `godo-app/src/config/supabase.ts`**:
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = 'https://your-project.supabase.co'
   const supabaseAnonKey = 'eyJ...your-anon-key'

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

2. **Create API configuration** `godo-app/src/config/api.ts`:
   ```typescript
   export const API_CONFIG = {
     BASE_URL: __DEV__
       ? 'http://localhost:8000'  // Local development
       : 'https://your-app.up.railway.app',  // Production
     TIMEOUT: 10000,
   }
   ```

3. **Update your API service** to use the config:
   ```typescript
   import { API_CONFIG } from '../config/api'

   const apiClient = axios.create({
     baseURL: API_CONFIG.BASE_URL,
     timeout: API_CONFIG.TIMEOUT,
   })
   ```

## 🔧 Environment Variables Summary

### Railway Environment Variables
```bash
# Database
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...anon-key
SUPABASE_SERVICE_KEY=eyJ...service-key

# Security
JWT_SECRET=your-super-secret-jwt-key-256-bits-long
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# App
DEBUG=false
APP_NAME=Godo Event Discovery API
VERSION=1.0.0

# Redis (automatically set by Railway)
REDIS_URL=redis://default:password@host:port

# External APIs (optional)
EVENTBRITE_API_KEY=your-eventbrite-key
GOOGLE_MAPS_API_KEY=your-google-maps-key
NYC_OPEN_DATA_API_KEY=your-nyc-key
```

### Frontend Environment Variables (Expo)
```bash
# Create .env in godo-app/
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon-key
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app
```

## 🚀 Part 4: Continuous Deployment

### 4.1 GitHub Integration

1. **Connect GitHub to Railway**:
   - In Railway dashboard, go to your project
   - Settings → Connect GitHub repository
   - Choose your repository

2. **Auto-deploy setup**:
   - Railway will automatically deploy on every push to main branch
   - Configure branch in Settings if different

### 4.2 Database Migrations in Production

For future schema changes:

1. **Create migration script**:
   ```bash
   # backend/scripts/migrate.py
   import subprocess
   import os

   def run_migration(file_path):
       # Run migration using your preferred method
       pass

   if __name__ == "__main__":
       # Run new migrations
       run_migration("migrations/004_new_feature.sql")
   ```

2. **Run via Railway CLI**:
   ```bash
   railway run python scripts/migrate.py
   ```

## 🛡️ Security Best Practices

### 4.1 Supabase Security

1. **Enable RLS** on all tables
2. **Create proper policies** for data access
3. **Use service key only in backend**
4. **Never expose service key in frontend**

### 4.2 Railway Security

1. **Use environment variables** for all secrets
2. **Enable health checks**
3. **Set up proper CORS** in FastAPI
4. **Use HTTPS only** (Railway provides automatically)

### 4.3 API Security

```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # Specific domains in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

## 📊 Monitoring & Observability

### 4.1 Railway Monitoring

- **Logs**: `railway logs`
- **Metrics**: Available in Railway dashboard
- **Alerts**: Configure in Railway dashboard

### 4.2 Supabase Monitoring

- **Database metrics**: Supabase dashboard
- **API usage**: Supabase dashboard
- **Auth metrics**: Supabase Auth section

## 🚀 Part 5: Testing Your Deployment

### 5.1 Backend API Tests

```bash
# Health check
curl https://your-app.up.railway.app/health

# Authentication test
curl -X POST https://your-app.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Events endpoint
curl https://your-app.up.railway.app/events
```

### 5.2 Frontend Integration Test

1. **Update your frontend API URLs**
2. **Test authentication flow**
3. **Verify data fetching works**
4. **Test real-time features** (if using Supabase realtime)

## 🔄 Development Workflow

1. **Local Development**:
   - Use local database or Supabase staging
   - Local Redis instance
   - Frontend points to `localhost:8000`

2. **Staging** (optional):
   - Separate Railway project
   - Separate Supabase project
   - Test deployment pipeline

3. **Production**:
   - Main Railway deployment
   - Production Supabase project
   - Frontend points to Railway URL

## 📝 Troubleshooting

### Common Issues

1. **Railway deployment fails**:
   - Check `railway logs`
   - Verify all environment variables are set
   - Check `requirements.txt` is complete

2. **Database connection issues**:
   - Verify DATABASE_URL format
   - Check Supabase project is active
   - Verify IP allowlist (Supabase allows all by default)

3. **Redis connection issues**:
   - Ensure Railway Redis addon is active
   - Check REDIS_URL environment variable

4. **CORS issues**:
   - Update CORS settings in FastAPI
   - Check frontend domain configuration

### Debug Commands

```bash
# Railway debugging
railway logs --tail
railway shell  # Interactive shell in Railway environment
railway variables  # List all environment variables

# Local testing
python -m app.main  # Run FastAPI locally
redis-cli ping  # Test Redis connection
psql $DATABASE_URL  # Test database connection
```

## 🎯 Next Steps

1. **Set up monitoring and alerts**
2. **Configure backup strategies**
3. **Set up staging environment**
4. **Implement CI/CD pipeline**
5. **Add performance monitoring**
6. **Set up error tracking** (Sentry, etc.)

---

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **Supabase Docs**: https://supabase.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Your API Documentation**: https://your-app.up.railway.app/docs

Happy deploying! 🚀