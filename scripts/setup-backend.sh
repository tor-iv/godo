#!/bin/bash

# Godo Backend Setup Script
set -e

echo "🚀 Setting up Godo Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Create backend directory if it doesn't exist
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: Backend directory not found. Please ensure backend files are in place.${NC}"
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}📝 Creating backend environment file...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Created backend/.env from template${NC}"
    echo -e "${YELLOW}⚠️  Please update backend/.env with your actual API keys and secrets${NC}"
fi

# Build and start services
echo -e "${YELLOW}🏗️  Building backend services...${NC}"
docker-compose build godo-backend godo-worker godo-beat

echo -e "${YELLOW}🚀 Starting database and dependencies...${NC}"
docker-compose up -d supabase-db redis

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}📊 Setting up database schema...${NC}"
docker-compose run --rm godo-backend python -c "
import subprocess
import sys
try:
    with open('/app/database/schema.sql', 'r') as f:
        schema = f.read()
    from app.database import supabase_admin
    # Execute schema in chunks due to Supabase limitations
    statements = schema.split(';')
    for stmt in statements:
        if stmt.strip():
            try:
                supabase_admin.rpc('execute_sql', {'query': stmt + ';'}).execute()
            except Exception as e:
                print(f'Statement failed: {stmt[:50]}... Error: {e}')
    print('Database schema setup completed')
except Exception as e:
    print(f'Database setup failed: {e}')
    sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema setup completed${NC}"
else
    echo -e "${RED}❌ Database schema setup failed${NC}"
    echo -e "${YELLOW}💡 You may need to run the schema manually via psql${NC}"
fi

# Start backend services
echo -e "${YELLOW}🚀 Starting backend services...${NC}"
docker-compose up -d godo-backend godo-worker godo-beat

# Wait for services to start
sleep 5

# Check health
echo -e "${YELLOW}🏥 Checking backend health...${NC}"
sleep 3

if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy and running on http://localhost:8000${NC}"
    echo -e "${GREEN}📚 API documentation available at http://localhost:8000/docs${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo -e "${YELLOW}📋 Check logs with: docker-compose logs godo-backend${NC}"
fi

echo -e "${GREEN}🎉 Backend setup completed!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update backend/.env with your API keys"
echo "2. Visit http://localhost:8000/docs to explore the API"
echo "3. Check logs: npm run backend:logs"
echo "4. Access backend shell: npm run backend:shell"
echo ""
echo -e "${YELLOW}Available commands:${NC}"
echo "• npm run backend:up     - Start backend services"
echo "• npm run backend:down   - Stop backend services" 
echo "• npm run backend:logs   - View backend logs"
echo "• npm run backend:shell  - Access backend container"
echo "• npm run backend:test   - Run backend tests"