# MaryAI API Documentation

This directory contains the tools and documentation for keeping the MaryAI API documentation up-to-date.

## Files Overview

### 📄 `API_DOCUMENTATION.md`
- **Purpose**: Complete API documentation generated from the Swagger endpoint
- **Format**: Markdown with detailed endpoint descriptions, parameters, and data models
- **Auto-generated**: Yes, do not edit manually

### 🔧 `fetch-api-docs.js`
- **Purpose**: Node.js script that fetches API documentation from the backend
- **Source**: `https://api.maryai.uz/swagger/doc.json`
- **Output**: Generates `API_DOCUMENTATION.md`

### 🚀 `update-api-docs.sh`
- **Purpose**: Simple shell wrapper for updating documentation
- **Usage**: `./update-api-docs.sh`
- **Dependencies**: Node.js

## Quick Start

### Method 1: Using the Shell Script (Recommended)
```bash
./update-api-docs.sh
```

### Method 2: Using Node.js Directly
```bash
node fetch-api-docs.js
```

## When to Update

You should update the API documentation when:
- Backend API endpoints are added, modified, or removed
- Request/response schemas change
- Authentication requirements change
- New data models are introduced
- API version is updated

## Documentation Structure

The generated `API_DOCUMENTATION.md` includes:

1. **API Overview**: Version, base URL, description
2. **Authentication**: Bearer token requirements
3. **Endpoints**: Complete list with:
   - HTTP methods (GET, POST, PUT, DELETE)
   - Parameters (path, query, body)
   - Request/response schemas
   - Authentication requirements (🔒 = secured, 🔓 = public)
4. **Data Models**: All schema definitions with properties and examples

## Automation Options

### GitHub Actions (Future Enhancement)
You could add this to your CI/CD pipeline:
```yaml
name: Update API Docs
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: node fetch-api-docs.js
      - run: git add API_DOCUMENTATION.md
      - run: git commit -m "Auto-update API documentation"
      - run: git push
```

### Pre-commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
node fetch-api-docs.js
git add API_DOCUMENTATION.md
```

## Troubleshooting

### Common Issues

1. **Network Error**: Check internet connection and API availability
2. **JSON Parse Error**: Backend API might be down or returning invalid JSON
3. **Permission Error**: Ensure write permissions in the project directory

### Debug Mode
For debugging, you can modify `fetch-api-docs.js` to add more logging or save the raw JSON response.

## API Endpoint Information

- **Base URL**: `https://api.maryai.uz/`
- **Swagger Doc**: `https://api.maryai.uz/swagger/doc.json`
- **Authentication**: Bearer token (most endpoints)
- **Content-Type**: `application/json`

## Contributing

When making changes to the documentation system:
1. Test the script thoroughly
2. Update this README if adding new features
3. Ensure backward compatibility
4. Document any breaking changes

---

**Last Updated**: 2026-04-14  
**Maintainer**: AI Assistant (Cascade)  
**Version**: 1.0
