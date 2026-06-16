#!/bin/bash

# My Lab LIMS - Windows Build Script
# This script builds the Windows executable using Electron Builder

set -e

echo "=========================================="
echo "My Lab LIMS - Windows Build Process"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20.0.0 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm ci || npm install
echo "✅ Dependencies installed"
echo ""

# Build the Vite project
echo "🔨 Building Vite project..."
npm run build
echo "✅ Vite build completed"
echo ""

# Build Windows executable
echo "🔨 Building Windows executable with Electron Builder..."
npm run electron:build
echo "✅ Windows build completed"
echo ""

# Check if build was successful
if [ -d "dist-electron" ]; then
    echo "=========================================="
    echo "✅ Build Successful!"
    echo "=========================================="
    echo ""
    echo "Output directory: dist-electron/"
    echo "Executable files:"
    find dist-electron -name "*.exe" -o -name "*.msi" 2>/dev/null | sed 's/^/  - /'
    echo ""
else
    echo "❌ Build failed. Output directory not found."
    exit 1
fi
