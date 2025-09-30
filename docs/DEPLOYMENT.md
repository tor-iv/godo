# Godo Deployment Guide

Complete guide for deploying the Godo event discovery app to production.

## Overview

Godo uses a monorepo structure with:
- **Frontend**: React Native (Expo) - deployed via EAS or self-hosted
- **Backend**: Python FastAPI - deployed on Railway/Render
- **Database**: Supabase (managed PostgreSQL)
- **Cache/Jobs**: Redis (Railway/Render)
- **File Storage**: Supabase Storage

---

## Prerequisites

### Required Accounts
- [ ] Railway or Render account (backend hosting)
- [ ] Supabase account (database + auth)
- [ ] Expo account (for EAS build/submit)
- [ ] Apple Developer account (iOS deployment)
- [ ] Google Play Developer account (Android deployment)

### Required Tools
- [ ] Railway CLI or Render CLI
- [ ] EAS CLI (`npm install -g eas-cli`)
- [ ] Docker (for local testing)

---

## Environment Configuration

### Backend Environment Variables

Create `backend/.env.production`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Redis
REDIS_URL=redis://default:password@host:6379

# App Configuration
APP_NAME=Godo
VERSION=1.0.0
DEBUG=false
SECRET_KEY=your-secret-key-here

# API Keys
EVENTBRITE_API_KEY=your-key
GOOGLE_MAPS_API_KEY=your-key

# Celery
CELERY_BROKER_URL=redis://default:password@host:6379/0
CELERY_RESULT_BACKEND=redis://default:password@host:6379/1

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

### Frontend Environment Variables

Create `godo-app/.env.production`:

```bash
API_BASE_URL=https://api.yourdomain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## Railway Monorepo Deployment

Railway is recommended for its monorepo support and simple configuration.

### 1. Repository Setup

Railway automatically detects monorepo structure. Create `railway.json` in root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Backend Service

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# Deploy backend
railway up --service backend

# Set environment variables
railway variables set DATABASE_URL=postgresql://...
railway variables set REDIS_URL=redis://...
railway variables set SUPABASE_URL=https://...
# ... set all required variables
```

### 3. Redis Service

Add Redis through Railway dashboard:
1. Click "New" → "Database" → "Add Redis"
2. Copy the `REDIS_URL` connection string
3. Update backend environment variables

### 4. Celery Worker Service

Create separate service for Celery worker:

```bash
# In Railway dashboard, create new service
# Point to same repo, different start command:
cd backend && celery -A app.celery worker --loglevel=info
```

### 5. Celery Beat Service

Create service for scheduled tasks:

```bash
cd backend && celery -A app.celery beat --loglevel=info
```

---

## Supabase Setup

### 1. Create Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project
3. Note down:
   - Project URL
   - Anon/Public key
   - Service role key (keep secret!)

### 2. Database Schema

Run database migrations:

```bash
# From local machine with Supabase CLI
npx supabase db push

# Or run SQL directly in Supabase dashboard
# Copy contents of docs/database/database.sql
```

### 3. Row Level Security (RLS)

Enable RLS on all tables through Supabase dashboard:

```sql
-- Example RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### 4. Storage Buckets

Create storage buckets for:
- `profile-images` - User profile photos
- `event-images` - Event photos (if user-generated)

Set policies:
```sql
-- Allow authenticated users to upload profile images
CREATE POLICY "Users can upload own profile image"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## Mobile App Deployment

### iOS Deployment

#### 1. Configure EAS

```bash
cd godo-app
eas login
eas build:configure
```

Update `eas.json`:

```json
{
  "build": {
    "production": {
      "ios": {
        "buildType": "release",
        "bundler": "metro",
        "env": {
          "API_BASE_URL": "https://api.yourdomain.com"
        }
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDEFGHIJ"
      }
    }
  }
}
```

#### 2. Build & Submit

```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --latest
```

#### 3. App Store Connect

1. Create app listing in App Store Connect
2. Upload screenshots and metadata
3. Submit for review

### Android Deployment

#### 1. Build & Submit

```bash
# Build for Android
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --latest
```

#### 2. Google Play Console

1. Create app listing in Play Console
2. Upload screenshots and metadata
3. Submit for review

---

## Health Checks & Monitoring

### Backend Health Endpoint

Backend exposes `/health` endpoint:

```bash
curl https://api.yourdomain.com/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": 1234567890,
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "supabase": "healthy"
  }
}
```

### Railway Health Checks

Configure in Railway dashboard:
- **Path**: `/health`
- **Interval**: 60 seconds
- **Timeout**: 10 seconds
- **Unhealthy threshold**: 3

### Uptime Monitoring

Recommended services:
- Better Stack (formerly Better Uptime)
- UptimeRobot
- Pingdom

---

## Database Migrations

### Running Migrations

```bash
# In production (Railway)
railway run --service backend python -c 'from app.database import execute_schema; execute_schema()'

# Or via Supabase dashboard
# Run SQL scripts directly
```

### Migration Best Practices

1. **Test locally first** with Docker environment
2. **Backup database** before production migrations
3. **Run during low-traffic** hours
4. **Monitor errors** immediately after migration
5. **Have rollback plan** ready

---

## Scaling Considerations

### Backend Scaling

Railway auto-scales based on:
- CPU usage
- Memory usage
- Request volume

Manual scaling:
```bash
railway service scale --replicas 3
```

### Database Scaling

Supabase plans:
- **Free**: Up to 500MB, 2GB bandwidth
- **Pro**: Starting at $25/mo, 8GB, 50GB bandwidth
- **Team/Enterprise**: Custom scaling

### Redis Scaling

Railway Redis:
- **Starter**: 512MB ($5/mo)
- **Developer**: 2GB ($15/mo)
- **Production**: 8GB+ (custom)

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend

  build-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install EAS CLI
        run: npm install -g eas-cli

      - name: Build iOS
        run: |
          cd godo-app
          eas build --platform ios --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## Production Validation

### Pre-Launch Checklist

- [ ] All environment variables set correctly
- [ ] Database migrations applied successfully
- [ ] RLS policies configured and tested
- [ ] Health checks responding correctly
- [ ] Celery workers and beat running
- [ ] Redis connected and responding
- [ ] Supabase auth working
- [ ] API endpoints returning expected data
- [ ] Mobile app connecting to production API
- [ ] Push notifications configured (Expo)
- [ ] Error tracking set up (Sentry)
- [ ] Analytics configured (optional)
- [ ] Domain SSL certificates valid
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Backup strategy in place

### Post-Launch Monitoring

1. **Monitor error rates** in first 24 hours
2. **Check database performance** and slow queries
3. **Verify Celery tasks** running on schedule
4. **Monitor API response times**
5. **Track user sign-ups and onboarding**
6. **Review crash reports** from mobile apps

---

## Rollback Procedures

### Backend Rollback

```bash
# Rollback to previous deployment
railway rollback --service backend

# Or redeploy specific commit
git checkout <previous-commit>
railway up --service backend
```

### Mobile App Rollback

- iOS: Submit urgent update or request expedited review
- Android: Rollback through Play Console (50% → 100% rollout)

### Database Rollback

```bash
# Restore from Supabase backup
# Dashboard → Settings → Backups → Restore

# Or use SQL dump
pg_restore -d database_url backup_file.dump
```

---

## Support & Troubleshooting

### Common Issues

**Backend not starting:**
- Check environment variables in Railway dashboard
- Review logs: `railway logs --service backend`
- Verify database connection string

**Database connection errors:**
- Check Supabase project status
- Verify connection string format
- Check IP allowlist (Supabase allows all by default)

**Celery tasks not running:**
- Verify worker service is running
- Check Redis connection
- Review Celery logs

**Mobile app can't connect:**
- Verify API_BASE_URL in production build
- Check CORS settings in backend
- Test health endpoint directly

### Getting Help

- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
- Expo Forums: [forums.expo.dev](https://forums.expo.dev)

---

## Cost Estimates

### Monthly Costs (Production)

- **Railway Backend**: $5-20/mo (depends on usage)
- **Railway Redis**: $5-15/mo
- **Supabase Pro**: $25/mo (includes database, auth, storage)
- **Railway Celery Workers**: $5-10/mo per worker
- **Total Infrastructure**: ~$45-75/mo

### Additional Costs

- Apple Developer Program: $99/year
- Google Play Developer: $25 one-time
- Domain: $10-15/year
- SSL Certificate: Free (Let's Encrypt via Railway)
- External APIs: Variable (Eventbrite, Google Maps, etc.)