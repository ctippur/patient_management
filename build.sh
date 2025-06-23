#!/bin/bash
# Simple build script to prepare files for deployment

echo "Preparing files for deployment..."

# Create a build directory
mkdir -p build

# Copy all files from public to build
cp -r public/* build/

# Copy root HTML files to the build directory
cp index.html build/
cp dashboard.html build/

# Copy the redirects file to the build directory
cp public/amplify-redirects.json build/

# Fix any remaining absolute paths in JS files
find build -name "*.js" -type f -exec sed -i '' 's|window.location.href = "/|navigateTo("|g' {} \;
find build -name "*.html" -type f -exec sed -i '' 's|href="/|href="|g' {} \;

# Fix any links in HTML templates
find build -name "*.js" -type f -exec sed -i '' 's|href="/|href="|g' {} \;

echo "Build complete! Files are ready in the build directory."