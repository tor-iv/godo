#!/bin/bash

# Deployment script for Godo Backend
# This script handles the deployment process for both development and production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
check_requirements() {
    log_info "Checking deployment requirements..."

    if [ ! -f "requirements.txt" ]; then
        log_error "requirements.txt not found!"
        exit 1
    fi

    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile not found!"
        exit 1
    fi

    if [ "$1" = "prod" ] && [ ! -f ".env.prod" ]; then
        log_error ".env.prod not found for production deployment!"
        exit 1
    fi

    if [ "$1" != "prod" ] && [ ! -f ".env" ]; then
        log_error ".env not found for development deployment!"
        exit 1
    fi

    log_info "All requirements satisfied ✓"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."

    if [ "$1" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml build --no-cache
    else
        docker-compose build --no-cache
    fi

    log_info "Docker images built successfully ✓"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."

    if [ "$1" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml up -d postgres
        sleep 10
        # Wait for postgres to be ready
        docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
    else
        docker-compose up -d postgres
        sleep 10
        # Wait for postgres to be ready
        docker-compose exec postgres pg_isready -U ${POSTGRES_USER:-godo_user} -d ${POSTGRES_DB:-godo_db}
    fi

    log_info "Database migrations completed ✓"
}

# Deploy services
deploy_services() {
    log_info "Deploying services..."

    if [ "$1" = "prod" ]; then
        # Production deployment
        docker-compose -f docker-compose.prod.yml down
        docker-compose -f docker-compose.prod.yml up -d

        # Wait for services to be healthy
        log_info "Waiting for services to be healthy..."
        sleep 30

        # Check health
        if ! curl -f http://localhost:8000/health; then
            log_error "Health check failed!"
            docker-compose -f docker-compose.prod.yml logs backend
            exit 1
        fi
    else
        # Development deployment
        docker-compose down
        docker-compose up -d

        # Wait for services to be healthy
        log_info "Waiting for services to be healthy..."
        sleep 30

        # Check health
        if ! curl -f http://localhost:8000/health; then
            log_error "Health check failed!"
            docker-compose logs backend
            exit 1
        fi
    fi

    log_info "Services deployed successfully ✓"
}

# Clean up old images and containers
cleanup() {
    log_info "Cleaning up old Docker resources..."

    # Remove dangling images
    docker image prune -f

    # Remove unused volumes (be careful with this in production)
    if [ "$1" != "prod" ]; then
        docker volume prune -f
    fi

    log_info "Cleanup completed ✓"
}

# Main deployment function
deploy() {
    local env=${1:-dev}

    log_info "Starting deployment for environment: $env"

    check_requirements $env
    build_images $env
    run_migrations $env
    deploy_services $env
    cleanup $env

    log_info "Deployment completed successfully! 🚀"

    if [ "$env" = "prod" ]; then
        log_info "Production API is available at: https://your-domain.com"
    else
        log_info "Development API is available at: http://localhost:8000"
        log_info "API documentation: http://localhost:8000/docs"
    fi
}

# Script usage
usage() {
    echo "Usage: $0 [dev|prod]"
    echo "  dev  - Deploy for development (default)"
    echo "  prod - Deploy for production"
    exit 1
}

# Main script
case "${1:-dev}" in
    dev)
        deploy dev
        ;;
    prod)
        deploy prod
        ;;
    *)
        usage
        ;;
esac