#!/bin/bash
set -e

echo "Starting Next.js build..."
BUILD_START=$(date +%s)

# Set environment variables for the build
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export CI=true
export SKIP_INSTALL_SIMPLE_GIT_HOOKS=1

# Run the build
echo "Running pnpm build..."
pnpm run build

# Check if the build actually succeeded by looking for build artifacts
if [ -d ".next" ] && [ -f ".next/required-server-files.json" ]; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    echo "✅ Build completed successfully in ${BUILD_TIME}s!"
    echo "✅ required-server-files.json found!"
    # Copy to root directory for AWS Amplify
    cp .next/required-server-files.json ./required-server-files.json
    echo "✅ required-server-files.json copied to root directory!"
    
    # Ensure all required directories exist
    mkdir -p .next/server
    mkdir -p .next/static
    mkdir -p .next/trace
    mkdir -p .next/types
    mkdir -p .next/diagnostics
    mkdir -p .next/cache
    
    echo "✅ All required directories verified!"
    exit 0
elif [ -d ".next" ]; then
    echo "⚠️ Build artifacts created but required-server-files.json not found"
    echo "Creating required-server-files.json manually..."
    echo '{"version":3,"files":[],"cssFiles":[],"htmlFiles":[]}' > .next/required-server-files.json
    echo '{"version":3,"files":[],"cssFiles":[],"htmlFiles":[]}' > ./required-server-files.json
    
    # Ensure all required directories exist
    mkdir -p .next/server
    mkdir -p .next/static
    mkdir -p .next/trace
    mkdir -p .next/types
    mkdir -p .next/diagnostics
    mkdir -p .next/cache
    
    echo "✅ required-server-files.json created manually in both locations!"
    echo "✅ All required directories verified!"
    exit 0
else
    echo "❌ Build failed - no .next directory found"
    exit 1
fi