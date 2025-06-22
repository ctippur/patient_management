#!/bin/bash
# Simple build script to prepare files for deployment

echo "Preparing files for deployment..."

# Create a build directory
mkdir -p build

# Copy all files from public to build
cp -r public/* build/

# Fix any remaining absolute paths in JS files
find build -name "*.js" -type f -exec sed -i '' 's|window.location.href = "/|window.location.href = "|g' {} \;
find build -name "*.js" -type f -exec sed -i '' 's|fetch("/|fetch("|g' {} \;
find build -name "*.html" -type f -exec sed -i '' 's|src="/|src="|g' {} \;
find build -name "*.html" -type f -exec sed -i '' 's|href="/|href="|g' {} \;

# Create a root index.html that redirects to the public/index.html
cat > build/root-index.html << EOF
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=index.html">
  <title>Redirecting...</title>
</head>
<body>
  Redirecting to <a href="index.html">index.html</a>...
</body>
</html>
EOF

# Copy the root index.html to the root directory
cp build/root-index.html build/index.html

# Copy the rewrite rules to the build directory
cp public/rewrite-rules.json build/

echo "Build complete! Files are ready in the build directory."