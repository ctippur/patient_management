#!/bin/bash
# Simple build script to prepare files for deployment

echo "Preparing files for deployment..."

# Create a build directory
mkdir -p build/public

# Copy the root index.html to the build directory
cp index.html build/

# Copy all files from public to build/public
cp -r public/* build/public/

# Fix any remaining absolute paths in JS files
find build -name "*.js" -type f -exec sed -i '' 's|window.location.href = "/|window.location.href = "|g' {} \;
find build -name "*.js" -type f -exec sed -i '' 's|fetch("/|fetch("|g' {} \;
find build -name "*.html" -type f -exec sed -i '' 's|src="/|src="|g' {} \;
find build -name "*.html" -type f -exec sed -i '' 's|href="/|href="|g' {} \;

echo "Build complete! Files are ready in the build directory."