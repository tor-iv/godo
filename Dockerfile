# Dockerfile for React Native/Expo Development Environment
FROM node:20-bullseye

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV EXPO_USE_FAST_RESOLVER=1
ENV EXPO_CLI_VERSION=6.3.10

# Install system dependencies for React Native and Android development
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    openjdk-11-jdk \
    android-tools-adb \
    python3 \
    python3-pip \
    build-essential \
    watchman \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64

# Install Android SDK
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=$ANDROID_HOME
ENV PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools

RUN mkdir -p $ANDROID_HOME && \
    cd $ANDROID_HOME && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O commandlinetools.zip && \
    unzip -q commandlinetools.zip && \
    rm commandlinetools.zip && \
    mkdir -p cmdline-tools/latest && \
    mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true

ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Accept Android licenses and install platform tools
RUN yes | sdkmanager --licenses >/dev/null 2>&1 && \
    sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0" >/dev/null 2>&1

# Install global npm packages
RUN npm install -g \
    @expo/cli@$EXPO_CLI_VERSION \
    @expo/ngrok@^4.1.0 \
    npm-check-updates \
    typescript \
    create-expo-app

# Create app directory
WORKDIR /app

# Create non-root user for development
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /bin/bash appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Copy package.json files if they exist (for caching)
COPY --chown=appuser:appuser package*.json ./

# Set up git configuration
RUN git config --global user.name "Developer" && \
    git config --global user.email "dev@godo.app" && \
    git config --global init.defaultBranch main

# Expose ports for Expo dev server and Metro bundler
EXPOSE 3000 8081 19000 19001 19002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node --version && npm --version && expo --version || exit 1

# Default command
CMD ["bash"]