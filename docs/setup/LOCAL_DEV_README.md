# Local Development Environment

This guide covers setting up and using the local development environment for the Godo event discovery app.

## Quick Start

```bash
# One-time setup
npm run setup:local

# Start development
npm run start

# Or run specific platforms
npm run ios      # iOS Simulator
npm run android  # Android Emulator  
npm run web      # Web Browser
```

## Development Workflows

### Local vs Containerized Development

| Feature | Local Development | Containerized Development |
|---------|------------------|---------------------------|
| **Setup Time** | ~5 minutes | ~15 minutes (first time) |
| **Performance** | Native speed | Slight overhead |
| **Consistency** | Depends on local env | Identical across machines |
| **Backend Services** | Manual setup needed | Automatic (Docker Compose) |
| **Mobile Testing** | Direct device/simulator | Tunnel mode required |
| **Dependencies** | Local Node.js/npm | Containerized |

### When to Use Local Development

✅ **Best for:**
- Fast iteration and hot reloading
- Direct iOS/Android simulator access
- Frontend-only development
- Quick prototyping
- Daily development work

### When to Use Containerized Development

✅ **Best for:**
- Full-stack development with backend
- Consistent team environments
- Database integration testing
- Production-like environment
- New team member onboarding

## Local Development Commands

### Setup & Management
```bash
npm run setup:local          # Initial local environment setup
```

### Development Server
```bash
npm run start                # Start Expo dev server
npm run ios                  # Run on iOS simulator
npm run android              # Run on Android emulator
npm run web                  # Run in web browser
```

### Code Quality
```bash
npm run typecheck            # TypeScript type checking
npm run lint                 # Run ESLint
npm run lint:fix             # Fix ESLint issues
npm run format               # Format with Prettier
```

### Advanced Options
```bash
cd godo-app && npm run tunnel    # Tunnel mode for mobile testing
cd godo-app && npm run clear     # Clear Metro cache
```

## Mobile Testing Options

### 1. Expo Go App (Recommended)
1. Install Expo Go on your phone
2. Run `npm run start`
3. Scan QR code with Expo Go (Android) or Camera (iOS)

### 2. iOS Simulator (macOS only)
```bash
npm run ios
```

### 3. Android Emulator
```bash
npm run android
```

### 4. Web Browser
```bash
npm run web
```

## Environment Configuration

### Local Environment Variables

Edit `.env.local` for local development settings:

```env
# API Configuration
API_BASE_URL=http://localhost:3001
SUPABASE_URL=http://localhost:8000

# Development Settings
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
EXPO_USE_FAST_RESOLVER=1

# Feature Flags
ENABLE_DEBUG_MODE=true
```

### VS Code Configuration

The project includes VS Code settings for optimal development:

- **Auto-formatting** on save with Prettier
- **ESLint** integration with auto-fix
- **TypeScript** path mapping support
- **React Native** snippets and tools

Recommended extensions are automatically suggested when opening the project.

## Troubleshooting

### Common Issues

**Metro bundler not starting:**
```bash
cd godo-app && npm run clear
```

**TypeScript errors:**
```bash
npm run typecheck
```

**Formatting issues:**
```bash
npm run format
```

**iOS Simulator not found:**
- Install Xcode from App Store
- Open Xcode and install additional components

**Android issues:**
- Set `ANDROID_HOME` environment variable
- Install Android Studio and SDK

### Performance Tips

1. **Enable Fast Refresh**: Automatically enabled in Expo
2. **Use Metro cache**: Only clear when necessary
3. **Optimize imports**: Use absolute imports with `@/` prefix
4. **Close unused apps**: Free up system resources

### Development Workflow

1. **Start development server**: `npm run start`
2. **Make code changes**: Files automatically reload
3. **Test on device/simulator**: Use QR code or direct launch
4. **Check types**: `npm run typecheck` before committing
5. **Format code**: `npm run format` or auto-format on save

## File Structure

```
godo/
├── godo-app/                 # Main React Native app
│   ├── src/                  # Source code
│   │   ├── components/       # Reusable components
│   │   ├── screens/          # Screen components
│   │   ├── navigation/       # Navigation setup
│   │   ├── types/            # TypeScript definitions
│   │   ├── constants/        # App constants
│   │   └── utils/            # Utility functions
│   ├── package.json          # App dependencies
│   └── tsconfig.json         # TypeScript config
├── scripts/
│   ├── local-setup.sh        # Local setup script
│   └── setup.sh              # Docker setup script
├── .env.local                # Local environment variables
├── .vscode/                  # VS Code configuration
└── package.json              # Workspace scripts
```

## IDE Integration

### VS Code Setup
The project includes optimized VS Code settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### Recommended Workflow
1. Open project in VS Code
2. Install recommended extensions when prompted
3. Code formatting and linting happen automatically
4. Use `Cmd+Shift+P` → "TypeScript: Restart TS Server" if needed

## Next Steps

After local setup:

1. **Test the app**: `npm run start` and scan QR code
2. **Verify hot reloading**: Make a small change and see it update
3. **Check code quality**: Run `npm run typecheck` and `npm run lint`
4. **Start building features**: Follow the day-1-setup-guide for next steps

For full-stack development with backend services, consider using the containerized environment with `npm run setup:docker`.