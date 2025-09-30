# Backend Deployment Guide

This guide covers the deployment process for the Godo Event Discovery API backend.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Python 3.11+ (for local development)
- PostgreSQL (if running without Docker)
- Redis (if running without Docker)

### Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables:**
   ```bash
   # Required variables
   DATABASE_URL=postgresql://username:password@localhost:5432/godo_db
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   REDIS_URL=redis://localhost:6379
   ```

### Development Deployment

```bash
# Using the deployment script
./scripts/deploy.sh dev

# Or manually with Docker Compose
docker compose up -d

# Check status
docker compose ps
curl http://localhost:8000/health
```

### Production Deployment

```bash
# Copy production environment
cp .env.example .env.prod
# Configure production values in .env.prod

# Deploy
./scripts/deploy.sh prod

# Or manually
docker compose -f docker-compose.prod.yml up -d
```

## 📁 Deployment Architecture

### Container Services

1. **Backend API** (FastAPI)
   - Port: 8000
   - Workers: 4 (production)
   - Health checks enabled

2. **PostgreSQL Database**
   - Port: 5432
   - Auto-migrations on startup
   - Persistent data volume

3. **Redis Cache**
   - Port: 6379
   - Background job queue
   - Session storage

4. **Celery Worker**
   - Background job processing
   - Event discovery tasks
   - ML recommendations

5. **Celery Beat**
   - Scheduled task management
   - Periodic event updates

6. **Nginx Reverse Proxy**
   - SSL termination
   - Rate limiting
   - CORS handling
   - Load balancing

### File Structure

```
backend/
├── app/                    # Application code
│   ├── main.py            # FastAPI application
│   ├── config.py          # Configuration
│   ├── database.py        # Database connections
│   ├── celery.py          # Background jobs
│   ├── models/            # Data models
│   ├── routers/           # API endpoints
│   └── utils/             # Utilities
├── database/
│   └── migrations/        # SQL migration files
├── nginx/                 # Nginx configurations
├── scripts/
│   └── deploy.sh          # Deployment script
├── Dockerfile             # Production container
├── docker-compose.yml     # Development services
├── docker-compose.prod.yml # Production services
├── requirements.txt       # Python dependencies
└── .env.example          # Environment template
```

## 🔧 Configuration

### Environment Variables

#### Required
- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `JWT_SECRET`: JWT signing secret
- `REDIS_URL`: Redis connection string

#### Optional
- `DEBUG`: Enable debug mode (false for production)
- `LOG_LEVEL`: Logging level (info, warning, error)
- `WORKERS`: Number of Uvicorn workers (4 for production)
- `SENTRY_DSN`: Error tracking with Sentry
- `RATE_LIMIT_PER_MINUTE`: API rate limiting (100)

### Database Configuration

The database is automatically initialized with:
- User tables and relationships
- Event and venue data structures
- Indexes for performance
- Triggers for automatic timestamps

### Security Features

- Non-root container user
- Read-only file system where possible
- Resource limits in production
- Rate limiting on API endpoints
- CORS configuration
- Security headers via Nginx

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```bash
curl http://localhost:8000/health
```

Returns:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": 1234567890,
  "services": {
    "supabase": "healthy",
    "redis": "healthy",
    "overall": "healthy"
  }
}
```

### Container Health Checks

All services include Docker health checks:
- Backend: HTTP health endpoint
- PostgreSQL: `pg_isready` command
- Redis: Redis ping command

### Logging

- Application logs: `/app/logs/app.log`
- Nginx logs: `/var/log/nginx/`
- Docker logs: `docker compose logs [service]`

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   docker compose exec postgres pg_isready

   # View database logs
   docker compose logs postgres
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   docker compose exec redis redis-cli ping

   # View Redis logs
   docker compose logs redis
   ```

3. **Backend Service Unhealthy**
   ```bash
   # Check backend logs
   docker compose logs backend

   # Check resource usage
   docker stats
   ```

4. **SSL Certificate Issues (Production)**
   ```bash
   # Check certificate files
   ls -la nginx/ssl/

   # Test SSL configuration
   docker compose exec nginx nginx -t
   ```

### Performance Tuning

1. **Resource Limits**
   - Adjust memory and CPU limits in `docker-compose.prod.yml`
   - Monitor with `docker stats`

2. **Database Optimization**
   - Add indexes for frequently queried columns
   - Monitor query performance
   - Configure PostgreSQL memory settings

3. **Redis Optimization**
   - Set appropriate memory limits
   - Configure eviction policies
   - Monitor key expiration

## 🔄 Updates & Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
./scripts/deploy.sh prod

# Or manually
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### Database Migrations

New migration files in `database/migrations/` are automatically applied on container startup.

### Backup Strategy

1. **Database Backup**
   ```bash
   docker compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql
   ```

2. **Redis Backup**
   ```bash
   docker compose exec redis redis-cli BGSAVE
   ```

3. **Application Data**
   - Logs: `/var/log/godo/`
   - ML Models: `/var/lib/godo/ml_models/`
   - Uploads: Application-specific storage

## 🌐 Production Considerations

### SSL/TLS Configuration

1. **Obtain SSL Certificate**
   ```bash
   # Using Let's Encrypt
   certbot certonly --webroot -w /var/www/html -d your-domain.com
   ```

2. **Update Nginx Configuration**
   - Copy certificates to `nginx/ssl/`
   - Update domain in `nginx/nginx.prod.conf`

### Domain Configuration

1. **DNS Settings**
   - Point A record to server IP
   - Configure CNAME for subdomains

2. **Firewall Rules**
   ```bash
   # Allow HTTP/HTTPS traffic
   ufw allow 80
   ufw allow 443
   ```

### Scaling Considerations

1. **Horizontal Scaling**
   - Load balancer configuration
   - Session storage in Redis
   - Stateless application design

2. **Database Scaling**
   - Read replicas
   - Connection pooling
   - Query optimization

3. **Caching Strategy**
   - Redis for session data
   - Application-level caching
   - CDN for static assets

## 📈 Metrics & Monitoring

### Key Metrics to Monitor

- Response times
- Error rates
- Database connection pool
- Redis memory usage
- Container resource usage

### Alerting

Set up alerts for:
- High error rates
- Database connectivity issues
- Memory/CPU threshold exceeded
- Certificate expiration

## 🔒 Security Checklist

- [ ] Environment variables secured
- [ ] SSL certificates configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Database credentials rotated
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Verify environment configuration
4. Test individual service health checks

---

This deployment guide provides a comprehensive overview of the backend deployment process. Follow the appropriate section based on your deployment environment (development or production).