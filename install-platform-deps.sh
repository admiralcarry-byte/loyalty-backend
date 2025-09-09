#!/bin/bash

# Platform-specific dependency installation script
# This script ensures that platform-specific packages like sharp are installed correctly

echo "🔧 Installing platform-specific dependencies..."

# Detect the platform
PLATFORM=$(uname -s)
ARCH=$(uname -m)

echo "📍 Detected platform: $PLATFORM-$ARCH"

# Install sharp with platform-specific binaries
echo "📦 Installing sharp for $PLATFORM-$ARCH..."
npm install --include=optional sharp

# For Linux environments, ensure we have the correct binaries
if [[ "$PLATFORM" == "Linux" ]]; then
    echo "🐧 Linux detected - ensuring correct sharp binaries..."
    npm install --os=linux --cpu=x64 sharp
fi

# For Alpine Linux (common in Docker)
if [[ -f /etc/alpine-release ]]; then
    echo "🏔️  Alpine Linux detected - installing additional dependencies..."
    apk add --no-cache vips-dev
fi

echo "✅ Platform-specific dependencies installed successfully!"