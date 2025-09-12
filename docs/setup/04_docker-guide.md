# Docker Development Environment

This document describes the containerized development setup for the Godo event discovery app.

## Quick Start

1. **Prerequisites**
   - Docker Desktop installed and running
   - Docker Compose available
   - At least 4GB RAM allocated to Docker

2. **Initial Setup**
   ```bash
   # Run the setup script
   ./scripts/setup.sh
   
   # Or manually:
   npm run setup
   ```

3. **Start Development**
   ```bash
   # Start the Expo development server
   npm run expo:start
   
   # In another terminal, get a shell inside the container
   npm run dev:shell
   ```

## Container Architecture

### Main Services

- **godo-dev**: Main development container with Node.js, Expo CLI, Android SDK
- **supabase-db**: PostgreSQL database for local development
- **supabase-api**: Supabase Auth service (GoTrue)
- **inbucket**: Email testing service
- **redis**: Caching layer (optional)

### Ports

| Service | Port | Description |
|---------|------|-------------|
| Expo Dev Server | 3000 | Main development server |
| Metro Bundler | 8081 | React Native bundler |
| Expo DevTools | 19000-19002 | Development tools |
| PostgreSQL | 5432 | Database connection |
| GoTrue API | 9999 | Authentication service |
| Inbucket Web | 9000 | Email testing interface |
| Redis | 6379 | Cache service |

## Development Workflow

### Starting Development

```bash
# Start all services
npm run services:up

# Start Expo in tunnel mode (for mobile testing)
npm run expo:start

# Or start with local network
docker-compose exec godo-dev bash -c 'cd godo-app && npx expo start'
```

### Common Commands

```bash
# Container management
npm run dev              # Start development container
npm run dev:shell        # Get shell access
npm run dev:logs         # View container logs
npm run dev:clean        # Clean rebuild

# Services
npm run services:up      # Start backend services
npm run services:down    # Stop all services
npm run services:logs    # View service logs

# Expo commands
npm run expo:install     # Install Expo packages
npm run expo:typecheck   # Run TypeScript check
npm run expo:lint        # Run ESLint

# Database
npm run db:reset         # Reset database (loses data!)
```

### File Structure

```
godo/
├── docker-compose.yml   # Service definitions
├── Dockerfile          # Development container
├── .dockerignore       # Docker ignore rules
├── scripts/
│   └── setup.sh       # Setup automation
└── godo-app/          # Expo project (created after setup)
    ├── src/           # Source code
    ├── package.json   # Project dependencies
    └── ...
```

## Development Tips

### Hot Reloading

- Source code changes trigger automatic reloading
- The `/app` directory is mounted as a volume
- `node_modules` are cached for performance

### Mobile Testing

1. **Expo Go App**: Install on your phone, scan QR code from `npm run expo:start`
2. **iOS Simulator**: Available if running on macOS with Xcode
3. **Android Emulator**: Configure in the container with Android Studio

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec supabase-db psql -U postgres -d postgres

# Or from host machine
psql -h localhost -p 5432 -U postgres -d postgres
```

### Email Testing

- Visit http://localhost:9000 to see all sent emails
- All authentication emails appear here during development

## Troubleshooting

### Container Issues

```bash
# View all container status
docker-compose ps

# Rebuild with no cache
npm run dev:clean

# View specific service logs
docker-compose logs -f godo-dev
```

### Port Conflicts

If ports are already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port
```

### Performance Issues

1. **Increase Docker resources**: Docker Desktop → Settings → Resources
2. **Clear Metro cache**: In development container run `npx expo start --clear`
3. **Prune Docker**: `docker system prune -a`

### Environment Variables

Create `.env` file in project root:

```env
# Database
DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres

# Supabase
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=your-anon-key

# Development
NODE_ENV=development
```

## Security Notes

- Default passwords are for development only
- Change all secrets before production
- The container runs as non-root user for security
- Local services are not exposed outside Docker network

## Next Steps

After setup completion:

1. Follow the day-1-setup-guide.md for project structure
2. Install React Native dependencies inside container
3. Set up navigation and basic screens
4. Configure Supabase integration