# Godo App Deployment Guide

This guide covers deploying the Godo event discovery app to production environments.

## Prerequisites

### Required Tools
- Node.js 20+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- Python 3.11+ (for backend)
- Docker (optional, for containerized deployment)

### Required Accounts
- Expo account
- Apple Developer Account (for iOS)
- Google Play Console Account (for Android)
- Supabase account
- Cloud hosting provider (AWS, GCP, Azure, or similar)

## Environment Setup

### 1. Environment Variables

Copy the environment template and configure for each environment:

```bash
# In godo-app directory
cp .env.example .env
```

Fill in the following variables:

#### Production Environment Variables
```bash
NODE_ENV=production
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_BASE_URL=https://api.godo.app/api
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_EVENTBRITE_API_KEY=your-eventbrite-api-key
EXPO_PUBLIC_TICKETMASTER_API_KEY=your-ticketmaster-api-key
```

### 2. Backend Deployment

#### Python Backend Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up database:**
```bash
# Set up Supabase project
# Run migrations (when implemented)
alembic upgrade head
```

3. **Deploy backend:** Choose your preferred method:

**Option A: Cloud Run (Google Cloud)**
```bash
gcloud run deploy godo-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Option B: AWS Lambda with FastAPI**
```bash
# Install serverless framework
npm install -g serverless
serverless deploy
```

**Option C: Traditional VPS/Container**
```bash
# Using gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### 3. Frontend Deployment (React Native)

#### Build Configuration

1. **Configure EAS:**
```bash
cd godo-app
eas login
eas build:configure
```

2. **Build for different environments:**

**Staging Build:**
```bash
eas build --platform all --profile staging
```

**Production Build:**
```bash
eas build --platform all --profile production
```

#### App Store Deployment

**iOS App Store:**
```bash
eas submit --platform ios --profile production
```

**Google Play Store:**
```bash
eas submit --platform android --profile production
```

### 4. Web Deployment (Optional)

For web version deployment:

```bash
cd godo-app
npx expo export --platform web
# Deploy the 'dist' folder to your web hosting service
```

## Database Setup

### Supabase Configuration

1. **Create Supabase project**
2. **Set up authentication providers**
3. **Configure Row Level Security (RLS)**
4. **Set up database tables** (run SQL migrations)
5. **Configure Edge Functions** (if needed)

Example table creation:
```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  profile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_data JSONB,
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Events (swipe actions)
CREATE TABLE user_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  action TEXT CHECK (action IN ('private_calendar', 'public_calendar', 'not_interested', 'save_later')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Godo App

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Install dependencies
        run: |
          cd godo-app
          npm ci
          
      - name: Build app
        run: |
          cd godo-app
          eas build --platform all --profile production --non-interactive
```

## Monitoring & Analytics

### Sentry Setup (Error Monitoring)
```bash
npm install @sentry/react-native
```

### Analytics Setup
```bash
npm install @react-native-firebase/analytics
```

## Performance Optimization

### Bundle Analysis
```bash
cd godo-app
npx expo export --dump-sourcemap
npx expo export --dump-assetmap
```

### Image Optimization
- Use WebP format for images
- Implement lazy loading
- Use Expo Image for better performance

## Security Checklist

- [ ] Environment variables properly configured
- [ ] API keys secured and rotated
- [ ] HTTPS enforced on all endpoints
- [ ] App signing certificates secured
- [ ] Database RLS policies configured
- [ ] Authentication flows tested
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints

## Troubleshooting

### Common Issues

**Build Failures:**
- Check native dependencies compatibility
- Verify app.json configuration
- Ensure all environment variables are set

**Runtime Errors:**
- Check Sentry for error tracking
- Verify API endpoint connectivity
- Check database connection strings

**Performance Issues:**
- Use React DevTools Profiler
- Monitor bundle size
- Check image loading performance

## Rollback Strategy

### Emergency Rollback
```bash
# Rollback to previous build
eas build --platform all --profile production --clear-cache

# Or use store rollback features
eas submit --platform ios --latest --profile production
```

## Support & Maintenance

### Regular Tasks
- Monitor error rates in Sentry
- Review app store ratings and feedback
- Update dependencies monthly
- Check API rate limits and usage
- Review and rotate API keys quarterly

### Scaling Considerations
- Database connection pooling
- CDN for static assets
- Caching strategies
- Background job processing
- Load balancing for backend services

## Contact

For deployment issues or questions, contact the development team or refer to the project documentation in CLAUDE.md.