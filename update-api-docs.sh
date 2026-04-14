#!/bin/bash

# Update API Documentation Script
# 
# This is a simple wrapper script to update the API documentation
# Run this script whenever the backend API changes
#
# Usage: ./update-api-docs.sh

echo "🔄 Updating MaryAI API Documentation..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Run the fetch script
node fetch-api-docs.js

# Check if the script was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ API documentation updated successfully!"
    echo "� Check the updated documentation in: api-docs/"
    echo "📋 Main index: api-docs/README.md"
    echo ""
    echo "📊 Generated modules:"
    ls -1 api-docs/*.md | grep -v README.md | sed 's/.*\///' | sed 's/.md$//' | while read module; do
        echo "   - $module"
    done
    echo ""
    echo "📋 Next steps:"
    echo "   - Review the updated endpoints in relevant modules"
    echo "   - Check for any breaking changes"
    echo "   - Update frontend code if needed"
else
    echo ""
    echo "❌ Failed to update API documentation"
    echo "Please check the error messages above and try again"
    exit 1
fi
