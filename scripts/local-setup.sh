#!/bin/bash

# Godo Local Development Environment Setup Script
set -e

echo "🚀 Setting up Godo local development environment..."

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

# Check Node.js version
print_step "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ required. Current version: $(node --version)"
    print_error "Please update Node.js from https://nodejs.org/"
    exit 1
fi

print_success "Node.js $(node --version) is installed"

# Check npm version
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_success "npm $(npm --version) is installed"

# Install/Update Expo CLI
print_step "Installing/updating Expo CLI..."
npm install -g @expo/cli@latest

print_success "Expo CLI installed/updated"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the godo project root directory"
    exit 1
fi

# Install root dependencies
print_step "Installing workspace dependencies..."
npm install

print_success "Workspace dependencies installed"

# Navigate to app directory and install dependencies
if [ ! -d "godo-app" ]; then
    print_error "godo-app directory not found. Please run from project root."
    exit 1
fi

print_step "Installing app dependencies..."
cd godo-app
npm install

print_success "App dependencies installed"

# Install additional React Native tools (optional but helpful)
print_step "Installing additional development tools..."
npm install -g react-native-debugger-open || print_warning "Could not install react-native-debugger-open (optional)"

# Check if iOS development is available (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_step "Checking iOS development setup..."
    if command -v xcodebuild &> /dev/null; then
        print_success "Xcode is available for iOS development"
    else
        print_warning "Xcode not found. Install from App Store for iOS development"
    fi
    
    # Check for iOS Simulator
    if [ -d "/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app" ]; then
        print_success "iOS Simulator is available"
    else
        print_warning "iOS Simulator not found. Install Xcode Command Line Tools"
    fi
else
    print_warning "iOS development only available on macOS"
fi

# Check Android development setup
print_step "Checking Android development setup..."
if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ]; then
    print_success "Android SDK environment variables set"
    if command -v adb &> /dev/null; then
        print_success "Android Debug Bridge (adb) is available"
    else
        print_warning "adb not in PATH. Check Android SDK installation"
    fi
else
    print_warning "Android SDK not configured. Set ANDROID_HOME environment variable"
fi

# Create .env file for local development
print_step "Creating local environment configuration..."
cd ..
cat > .env.local << 'EOF'
# Local Development Environment Variables
NODE_ENV=development

# API Configuration (will be used when backend is ready)
API_BASE_URL=http://localhost:3001
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=your-local-anon-key

# Development Settings
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
EXPO_USE_FAST_RESOLVER=1

# Feature Flags
ENABLE_DEBUG_MODE=true
ENABLE_PERFORMANCE_MONITORING=false
EOF

print_success "Local environment configuration created"

# Run type checking
print_step "Running TypeScript type check..."
cd godo-app
if npx tsc --noEmit; then
    print_success "TypeScript compilation successful"
else
    print_error "TypeScript compilation failed. Check the errors above."
    exit 1
fi

# Test Expo setup
print_step "Testing Expo setup..."
if npx expo --version > /dev/null 2>&1; then
    print_success "Expo CLI is working correctly"
else
    print_error "Expo CLI test failed"
    exit 1
fi

print_success "Local development setup complete! 🎉"

echo ""
echo "📋 Local Development Commands:"
echo "  npm run start         # Start Expo development server"
echo "  npm run ios           # Run on iOS simulator (macOS only)"
echo "  npm run android       # Run on Android emulator"
echo "  npm run web           # Run in web browser"
echo "  npm run typecheck     # Run TypeScript checking"
echo "  npm run lint          # Run ESLint"
echo "  npm run format        # Format code with Prettier"
echo ""
echo "📱 Mobile Testing:"
echo "1. Install Expo Go app on your phone"
echo "2. Run 'npm run start' in the godo-app directory"
echo "3. Scan the QR code with Expo Go (Android) or Camera (iOS)"
echo ""
echo "🔧 IDE Setup:"
echo "- Install React Native Tools extension for VS Code"
echo "- Install ES7+ React/Redux/React-Native snippets"
echo "- Install Prettier and ESLint extensions"
echo ""
echo "💡 Tips:"
echo "- Use 'npm run start -- --clear' to clear Metro cache"
echo "- Press 'r' in terminal to reload the app"
echo "- Press 'm' to open developer menu"
echo "- Shake device or press Cmd+D (iOS) / Cmd+M (Android) for dev menu"
echo ""