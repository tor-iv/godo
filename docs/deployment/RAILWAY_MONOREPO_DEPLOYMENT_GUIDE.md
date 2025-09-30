# Railway Monorepo Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Godo backend from your monorepo to Railway, with Redis integration for caching and Celery background jobs.

## Prerequisites

- [ ] Railway account created at [railway.app](https://railway.app)
- [ ] GitHub repository connected (`tor-iv/godo`)
- [ ] Railway CLI installed: `npm install -g @railway/cli`
- [ ] Supabase credentials ready
- [ ] Local Redis tested and working

## 🚀 Deployment Steps

### Step 1: Initial Railway Setup

#### 1.1 Install and Login
```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login
```

#### 1.2 Create New Project
```bash
# Option A: Create new project from CLI
railway init
# Follow prompts to create new project

# Option B: Link to existing project
railway link [project-id]
# Get project-id from Railway dashboard settings
```

### Step 2: GitHub Integration (Recommended Method)

#### 2.1 Connect GitHub Repository

**In Railway Dashboard:**

1. Click **"New"** button
2. Select **"GitHub Repo"**
3. Connect your GitHub account (if not already connected)
4. Search and select: `tor-iv/godo`
5. Click **"Deploy"**

#### 2.2 Configure Backend Service

**In Service Settings:**

1. Click on the deployed service
2. Go to **Settings** tab
3. Configure the following:

| Setting | Value |
|---------|-------|
| **Root Directory** | `/backend` |
| **Build Command** | (auto-detected) |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/health` |
| **Watch Paths** | `/backend/**` |

### Step 3: Add Redis Service

#### 3.1 Via Dashboard (Easiest)
1. In your project, click **"New"**
2. Select **"Database"**
3. Choose **"Redis"**
4. Railway automatically provisions Redis and sets `REDIS_URL`

#### 3.2 Via CLI (Alternative)
```bash
# From your project directory
railway add
# Select "Redis" from the menu
```

### Step 4: Configure Environment Variables

#### 4.1 Via Dashboard (Recommended)

Go to **Variables** tab and add:

```env
# Database
DATABASE_URL=postgresql://[your-supabase-url]
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-key]

# Authentication
JWT_SECRET=[your-32+-character-secret]
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis (auto-set by Railway)
REDIS_URL=[automatically-provided]

# Celery (use Redis URL with database selection)
CELERY_BROKER_URL=${{REDIS_URL}}/0
CELERY_RESULT_BACKEND=${{REDIS_URL}}/1

# Optional APIs
EVENTBRITE_API_KEY=[if-you-have-one]
GOOGLE_MAPS_API_KEY=[if-you-have-one]
NYC_OPEN_DATA_API_KEY=[if-you-have-one]
```

#### 4.2 Via CLI (Alternative)
```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set SUPABASE_URL="https://..."
railway variables set SUPABASE_KEY="..."
railway variables set JWT_SECRET="..."
# Add all other variables...
```

### Step 5: Deploy Additional Services (Celery)

#### 5.1 Create Celery Worker Service

1. In Railway dashboard, click **"New"** → **"Empty Service"**
2. Name it: `godo-celery-worker`
3. Connect to same GitHub repo: `tor-iv/godo`
4. In Settings:
   - **Root Directory**: `/backend`
   - **Start Command**: `celery -A app.celery worker --loglevel=info --concurrency=2`
5. Copy all environment variables from main service

#### 5.2 Create Celery Beat Service

1. Click **"New"** → **"Empty Service"**
2. Name it: `godo-celery-beat`
3. Connect to same GitHub repo: `tor-iv/godo`
4. In Settings:
   - **Root Directory**: `/backend`
   - **Start Command**: `celery -A app.celery beat --loglevel=info`
5. Copy all environment variables from main service

### Step 6: Deploy and Verify

#### 6.1 Trigger Deployment

**Automatic (GitHub Push):**
```bash
git add .
git commit -m "Configure Railway deployment"
git push origin main
```

**Manual (Dashboard):**
- Click **"Deploy"** button in Railway dashboard

**CLI (From backend directory):**
```bash
cd backend
railway up
```

#### 6.2 Verify Deployment

```bash
# Check deployment logs
railway logs

# Open Railway dashboard
railway open

# Test endpoints (replace with your URL)
curl https://[your-app].railway.app/health
curl https://[your-app].railway.app/metrics/redis
```

Expected health check response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "redis": {
      "status": "healthy",
      "details": {
        "version": "7.x.x",
        "memory_used": "2.5MB"
      }
    },
    "supabase": "healthy"
  }
}
```

## 📁 Project Structure

Your monorepo should maintain this structure:

```
godo/                           # GitHub repository root
├── backend/                    # Railway backend service
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   ├── config.py          # Configuration with Redis
│   │   ├── database.py        # Redis connection pooling
│   │   └── celery.py          # Celery configuration
│   ├── scripts/
│   │   └── test_redis.py      # Redis testing script
│   ├── railway.json           # Railway configuration
│   ├── Procfile              # Process definitions
│   ├── Dockerfile            # Container configuration
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment template
├── godo-app/                  # React Native app (not deployed)
│   ├── src/
│   └── package.json
└── docs/
    └── deployment/            # This guide
```

## 🔧 Configuration Files

### Railway Service Configuration (`backend/railway.json`)
Already configured with:
- Multi-service support (web, worker, beat)
- Health check endpoints
- Worker concurrency settings

### Procfile (`backend/Procfile`)
Defines service commands:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2
worker: celery -A app.celery worker --loglevel=info --concurrency=2 --pool=solo
beat: celery -A app.celery beat --loglevel=info
```

## 🔍 Monitoring and Debugging

### View Logs
```bash
# All logs
railway logs

# Specific service
railway logs --service=[service-name]

# Build logs
railway logs --build
```

### SSH into Service
```bash
railway shell
```

### Monitor Redis
```bash
# In Railway shell
redis-cli
> INFO
> MONITOR
```

### Check Celery
```bash
# In Railway shell
celery -A app.celery status
celery -A app.celery inspect active
```

## ⚠️ Important Notes

1. **Root Directory**: Setting `/backend` means Railway only builds and deploys that directory
2. **Config Path**: `railway.json` uses absolute path from repo root: `/backend/railway.json`
3. **Environment Variables**: Redis URL is auto-provided; Celery URLs reference it
4. **Frontend**: React Native app doesn't deploy to Railway - update API URL in app config
5. **Branches**: Railway can deploy from different branches (configure in settings)

## 🚨 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check `requirements.txt` is complete |
| Redis connection refused | Verify `REDIS_URL` is set in variables |
| Celery not processing | Ensure worker service is running |
| Health check failing | Check Supabase credentials |
| Memory issues | Scale up Railway plan or optimize Redis usage |

### Debug Commands

```bash
# Check environment variables
railway variables

# Restart service
railway restart

# Check service status
railway status

# View recent deployments
railway deployments
```

## 📊 Success Metrics

After successful deployment, verify:

- [ ] `/health` endpoint returns "healthy"
- [ ] `/metrics/redis` shows Redis stats
- [ ] Celery worker processes tasks
- [ ] Celery beat runs scheduled jobs
- [ ] API responds to requests
- [ ] Redis caching works (check hit ratio)
- [ ] No errors in logs

## 🔄 Continuous Deployment

### GitHub Integration Benefits
- **Auto-deploy** on push to main branch
- **Preview environments** for PRs
- **Rollback** to previous deployments
- **Branch deployments** for staging

### Deployment Flow
1. Push to GitHub → 2. Railway detects change → 3. Builds backend only → 4. Deploys services → 5. Health checks run

## 📱 Update Mobile App

After backend deployment, update your React Native app:

```typescript
// godo-app/src/config/api.config.ts
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://localhost:8000'
    : 'https://[your-railway-url].railway.app'
}
```

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/reference/cli-api)
- [Monorepo Guide](https://docs.railway.app/guides/monorepo)
- [Redis on Railway](https://docs.railway.app/databases/redis)

## 🎯 Next Steps

1. Deploy backend to Railway
2. Verify all endpoints work
3. Update mobile app API URL
4. Test end-to-end functionality
5. Set up monitoring alerts
6. Configure auto-scaling if needed

---

## Quick Reference Card

```bash
# Essential Commands
railway login                      # Authenticate
railway init                       # Create project
railway add                        # Add Redis
railway up                         # Deploy
railway logs                       # View logs
railway open                       # Open dashboard
railway variables set KEY=VALUE    # Set env var
railway restart                    # Restart service
railway shell                      # SSH into service
```

---

**Deployment Complete!** 🎉

Your backend is now ready to deploy to Railway with Redis caching, Celery background jobs, and full monitoring capabilities.