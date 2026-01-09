#!/bin/bash
# Tank Adventure Game - Environment Validation Script

echo "=== Tank Adventure Game - Init ==="
echo ""

# Check Node.js
echo "Node.js version:"
node --version

# Check npm
echo "npm version:"
npm --version

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "node_modules: OK"
else
    echo "node_modules: MISSING - run 'npm install'"
    exit 1
fi

# Check if dist exists (built)
if [ -d "dist" ]; then
    echo "dist/: OK (built)"
else
    echo "dist/: MISSING - run 'npm run build'"
fi

# Run TypeScript check
echo ""
echo "=== TypeScript Check ==="
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "TypeScript: OK"
else
    echo "TypeScript: ERRORS"
    exit 1
fi

# Run build
echo ""
echo "=== Build Check ==="
npm run build
if [ $? -eq 0 ]; then
    echo "Build: OK"
else
    echo "Build: FAILED"
    exit 1
fi

echo ""
echo "=== All Checks Passed ==="
