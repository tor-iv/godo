#!/bin/bash

# Godo Development Environment Setup Script
set -e

echo "🚀 Setting up Godo development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

print_success "Docker is running"

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    print_error "docker compose not found. Please install Docker Compose."
    exit 1
fi

print_success "Docker Compose is available"

# Build the development container
print_step "Building development container..."
docker compose build godo-dev

print_success "Development container built successfully"

# Start the services
print_step "Starting backend services..."
docker compose up -d supabase-db supabase-api inbucket redis

# Wait for database to be ready
print_step "Waiting for database to be ready..."
sleep 10

# Check if services are healthy
print_step "Checking service health..."
if docker compose ps | grep -q "unhealthy\|exited"; then
    print_warning "Some services may not be fully ready. Check with: npm run services:logs"
fi

# Initialize the Expo project if it doesn't exist
if [ ! -d "godo-app" ]; then
    print_step "Initializing Expo project..."
    docker compose run --rm godo-dev bash -c "
        npx create-expo-app godo-app --template expo-template-blank-typescript
        cd godo-app
        npm install
    "
    print_success "Expo project initialized"
else
    print_warning "Expo project already exists, skipping initialization"
fi

# Set up development dependencies if the project exists
if [ -d "godo-app" ]; then
    print_step "Installing development dependencies..."
    docker compose run --rm godo-dev bash -c "
        cd godo-app
        npm install
    "
    print_success "Dependencies installed"
fi

print_success "Setup complete! 🎉"

echo ""
echo "📋 Next steps:"
echo "1. Start development: npm run expo:start"
echo "2. Open a shell: npm run dev:shell"
echo "3. View logs: npm run dev:logs"
echo "4. Check health: npm run health"
echo ""
echo "📚 Useful commands:"
echo "- npm run services:up    # Start backend services"
echo "- npm run services:down  # Stop all services"
echo "- npm run dev:clean      # Clean rebuild"
echo ""
echo "🌐 Service URLs:"
echo "- Expo DevTools: http://localhost:19002"
echo "- Email Testing: http://localhost:9000"
echo "- PostgreSQL: localhost:5432"
echo ""