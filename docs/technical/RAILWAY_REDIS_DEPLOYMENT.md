# Redis on Railway Deployment Guide

## Overview

This guide covers deploying Redis to Railway as part of the Godo Event Discovery API backend. Redis serves as both a caching layer and message broker for Celery background jobs.

## ✅ Implementation Status

All Redis integration components have been successfully implemented and tested:

- ✅ **Configuration Updates**: Environment variable handling for Railway
- ✅ **Connection Pooling**: Enhanced Redis client with retry logic
- ✅ **Health Monitoring**: Detailed Redis health checks
- ✅ **Metrics Endpoint**: Real-time Redis performance monitoring
- ✅ **Celery Integration**: Background job queue support
- ✅ **Multi-Service Setup**: Railway configuration for web/worker/beat services

## 🚀 Deployment Steps

### Step 1: Add Redis Service to Railway

```bash
# Navigate to your Railway project
railway login
cd /path/to/your/backend

# Add Redis service
railway add
# Select "Redis" from the service list
```

### Step 2: Configure Environment Variables

Railway automatically provides `REDIS_URL` when you add Redis. Configure additional variables:

```bash
# Set Celery configuration
railway variables set CELERY_BROKER_URL="$REDIS_URL/0"
railway variables set CELERY_RESULT_BACKEND="$REDIS_URL/1"

# Verify Redis URL is set
railway variables
```

### Step 3: Deploy Backend Services

Our backend is configured for multi-service deployment:

```bash
# Deploy main web service
railway up

# The railway.json configuration includes:
# - web: FastAPI application
# - celery-worker: Background job processor
# - celery-beat: Scheduled task manager
```

### Step 4: Verify Deployment

Test your Redis integration:

```bash
# Health check (includes Redis status)
curl https://your-app.railway.app/health

# Redis metrics (detailed performance data)
curl https://your-app.railway.app/metrics/redis
```

## 📁 Files Modified

### Configuration Files

1. **`backend/app/config.py`**
   - Added Railway Redis URL environment handling
   - Dynamic Celery broker/backend URL configuration
   - Pydantic field validation for environment variables

2. **`backend/app/database.py`**
   - Enhanced Redis client with connection pooling
   - Retry logic with exponential backoff
   - Detailed health check with Redis metrics

3. **`backend/app/main.py`**
   - Added `/metrics/redis` endpoint for monitoring
   - Real-time Redis performance metrics

### Deployment Files

4. **`backend/railway.json`**
   - Multi-service configuration
   - Health check endpoints
   - Worker and beat service definitions

5. **`backend/Procfile`**
   - Service start commands
   - Worker concurrency settings

6. **`backend/scripts/test_redis.py`**
   - Comprehensive Redis testing suite
   - Connection, cache, and performance tests

## 🔧 Redis Configuration

### Connection Pool Settings

```python
# Connection pool configuration
pool = redis.ConnectionPool.from_url(
    settings.redis_url,
    max_connections=50,
    socket_connect_timeout=5,
    socket_timeout=5,
    retry=retry,
    retry_on_error=[ConnectionError, TimeoutError],
    decode_responses=True
)
```

### Celery Queue Configuration

- **Database 0**: Celery broker (job queue)
- **Database 1**: Celery result backend
- **Default**: Application caching

### Queue Structure

- `celery`: Default queue
- `events`: Event discovery tasks
- `notifications`: User notifications
- `ml`: Machine learning recommendations

## 📊 Monitoring

### Health Check Endpoint: `/health`

```json
{
  "status": "healthy",
  "services": {
    "redis": {
      "status": "healthy",
      "details": {
        "version": "7.x.x",
        "memory_used": "1.2MB",
        "connected_clients": 3,
        "uptime_days": 5
      }
    }
  }
}
```

### Metrics Endpoint: `/metrics/redis`

```json
{
  "status": "healthy",
  "metrics": {
    "memory": {
      "used_mb": 0.84,
      "peak_mb": 0.85
    },
    "connections": {
      "connected_clients": 2,
      "blocked_clients": 0
    },
    "performance": {
      "ops_per_sec": 45,
      "cache_hit_ratio": 0.8924
    },
    "queues": {
      "celery": 0,
      "events": 2,
      "notifications": 0,
      "ml": 1
    }
  }
}
```

## 🔍 Testing

### Local Testing

```bash
# Run comprehensive Redis test suite
cd backend
python scripts/test_redis.py

# Expected output:
# 🎯 Tests Passed: 6/6
# 🎉 All tests passed! Redis is ready for Railway deployment.
```

### Production Testing

```bash
# Test health endpoint
curl https://your-app.railway.app/health

# Test metrics endpoint
curl https://your-app.railway.app/metrics/redis

# Test Celery task execution
railway shell
python -c "from app.tasks import test_task; test_task.delay()"
```

## ⚡ Performance Optimizations

### Railway Redis Settings

```redis
# Recommended Redis configuration for Railway
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1 300 10 60 10000
timeout 300
tcp-keepalive 60
```

### Connection Tuning

- **Max Connections**: 50 (Railway limit consideration)
- **Connection Timeout**: 5 seconds
- **Retry Strategy**: Exponential backoff with 3 retries
- **Pool Recycle**: Automatic cleanup of idle connections

### Cache Strategy

- **User Sessions**: 30 minutes TTL
- **API Responses**: 5 minutes TTL
- **ML Recommendations**: 1 hour TTL
- **Static Data**: 24 hours TTL

## 🛟 Troubleshooting

### Common Issues

#### 1. Connection Refused
```
Error: [Errno 61] Connection refused
```
**Solution**: Verify Redis service is running in Railway dashboard

#### 2. Memory Issues
```
Error: OOM command not allowed
```
**Solution**: Implement cache eviction policy or upgrade Redis plan

#### 3. Celery Tasks Not Processing
```
Error: No workers available
```
**Solution**: Ensure celery-worker service is deployed and running

### Debug Commands

```bash
# Railway debugging
railway logs --service redis
railway shell
redis-cli info

# Local debugging
redis-cli ping
redis-cli monitor
python scripts/test_redis.py
```

## 🔐 Security

### Railway Security Features

- **Private Networking**: Redis accessible only within Railway project
- **Automatic Passwords**: Secure passwords generated automatically
- **SSL/TLS**: Encrypted connections between services
- **Access Control**: Environment-based connection strings

### Best Practices

1. **Never expose Redis URL** in frontend applications
2. **Use environment variables** for all Redis configuration
3. **Monitor connection counts** to prevent exhaustion
4. **Implement proper TTL** for all cached data
5. **Regular health monitoring** via endpoints

## 📈 Scaling Considerations

### Current Setup
- **Redis Instance**: Single Railway Redis service
- **Connection Pool**: 50 max connections
- **Workers**: 2 Celery workers
- **Memory**: Up to 512MB (configurable)

### Scaling Options
1. **Vertical**: Upgrade Railway Redis plan
2. **Horizontal**: Add more Celery workers
3. **Partitioning**: Separate cache and queue Redis instances
4. **Clustering**: Redis Cluster for high availability

## 🎯 Success Criteria

✅ **Deployment Success**:
- Health endpoint returns "healthy" for Redis
- Metrics endpoint shows performance data
- Celery tasks process successfully
- Zero connection timeouts in first 24 hours

✅ **Performance Success**:
- Cache operations < 10ms latency
- Memory usage < 80% of allocated
- Cache hit ratio > 80%
- Queue depth < 100 pending jobs

## 📞 Support

### Railway Resources
- [Railway Redis Documentation](https://docs.railway.app/databases/redis)
- [Railway Dashboard](https://railway.app/dashboard)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)

### Application Resources
- **Health Check**: `/health`
- **Redis Metrics**: `/metrics/redis`
- **API Documentation**: `/docs` (development only)

---

## 🎉 Deployment Complete!

Your Redis integration is now ready for Railway deployment with:

- **Enhanced Performance**: Connection pooling and retry logic
- **Comprehensive Monitoring**: Health checks and metrics
- **Production Ready**: Multi-service configuration
- **Scalable Architecture**: Celery background job processing

The system is configured for optimal performance and monitoring on Railway's infrastructure.