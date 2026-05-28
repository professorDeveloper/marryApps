#!/usr/bin/env node

/**
 * Fetch API Documentation Script
 * 
 * This script fetches the Swagger/OpenAPI documentation from the MaryAI backend
 * and converts it to a readable markdown format for easy reference.
 * 
 * Usage: node fetch-api-docs.js
 * 
 * The script will:
 * 1. Fetch the latest API documentation from https://api.maryai.uz/swagger/doc.json
 * 2. Parse the JSON response
 * 3. Generate a comprehensive markdown file
 * 4. Save it as API_DOCUMENTATION.md in the root folder
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'https://api.maryai.uz/swagger/doc.json';
const OUTPUT_DIR = path.join(__dirname, 'api-docs');
const INDEX_FILE = path.join(OUTPUT_DIR, 'README.md');

function fetchApiDocs() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Fetching API documentation from:', API_URL);
    
    https.get(API_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
  });
}

function groupEndpointsByModule(paths) {
  const modules = {};
  
  for (const [path, methods] of Object.entries(paths)) {
    // Extract module from path
    let module = 'core';
    
    if (path.includes('/auth/')) {
      module = 'auth';
    } else if (path.includes('/admin/')) {
      module = 'admin';
    } else if (path.includes('/bills')) {
      module = 'billing';
    } else if (path.includes('/branches')) {
      module = 'branches';
    } else if (path.includes('/cafe-tables')) {
      module = 'cafe';
    } else if (path.includes('/cash-register')) {
      module = 'cash';
    } else if (path.includes('/categories')) {
      module = 'menu';
    } else if (path.includes('/compound')) {
      module = 'warehouse';
    } else if (path.includes('/ingredient')) {
      module = 'warehouse';
    } else if (path.includes('/modifiers')) {
      module = 'menu';
    } else if (path.includes('/products')) {
      module = 'menu';
    } else if (path.includes('/recipes')) {
      module = 'kitchen';
    } else if (path.includes('/reports')) {
      module = 'reports';
    } else if (path.includes('/shifts')) {
      module = 'staff';
    } else if (path.includes('/stocks')) {
      module = 'warehouse';
    } else if (path.includes('/tables')) {
      module = 'cafe';
    } else if (path.includes('/translations')) {
      module = 'i18n';
    } else if (path.includes('/transfers')) {
      module = 'warehouse';
    } else if (path.includes('/users')) {
      module = 'users';
    } else if (path.includes('/waiter')) {
      module = 'staff';
    }
    
    if (!modules[module]) {
      modules[module] = {};
    }
    modules[module][path] = methods;
  }
  
  return modules;
}

function endpointPathToFileName(endpointPath) {
  // Convert /api/v1/some-resource/{id}/action -> some-resource_{id}_action
  return endpointPath
    .replace(/^\/+/, '')           // strip leading slashes
    .replace(/\//g, '_')           // replace slashes with underscores
    .replace(/[{}]/g, '')          // strip curly braces from path params
    .replace(/[^a-zA-Z0-9_\-]/g, '') // strip any remaining unsafe chars
    || 'index';
}

function generateEndpointMarkdown(endpointPath, methods, apiDoc) {
  const { host, basePath } = apiDoc;

  let markdown = `# ${endpointPath}\n\n`;
  markdown += `> **Base URL:** https://${host}${basePath}  \n`;
  markdown += `> **Last Updated:** ${new Date().toISOString()}\n\n---\n\n`;

  for (const [method, details] of Object.entries(methods)) {
    const methodUpper = method.toUpperCase();
    const security = details.security && details.security.length > 0 ? '🔒' : '🔓';

    markdown += `## ${methodUpper} ${endpointPath} ${security}\n\n`;
    markdown += `**Summary:** ${details.summary || '-'}\n\n`;
    markdown += `**Description:** ${details.description || '-'}\n\n`;

    if (details.parameters && details.parameters.length > 0) {
      markdown += `**Parameters:**\n\n`;
      markdown += `| Name | Location | Type | Required | Description |\n`;
      markdown += `|------|----------|------|----------|-------------|\n`;

      for (const param of details.parameters) {
        const required = param.required ? 'Yes' : 'No';
        const type = param.type || param.schema?.type || 'object';
        markdown += `| ${param.name} | ${param.in} | ${type} | ${required} | ${param.description || '-'} |\n`;
      }
      markdown += '\n';
    }

    if (details.parameters && details.parameters.some(p => p.in === 'body')) {
      const bodyParam = details.parameters.find(p => p.in === 'body');
      if (bodyParam && bodyParam.schema) {
        markdown += `**Request Body:**\n\n`;
        markdown += `\`\`\`json\n${JSON.stringify(bodyParam.schema, null, 2)}\n\`\`\`\n\n`;
      }
    }

    markdown += `**Responses:**\n\n`;
    for (const [statusCode, response] of Object.entries(details.responses)) {
      markdown += `- **${statusCode}**: ${response.description}\n`;
      if (response.schema) {
        markdown += `  \`\`\`json\n${JSON.stringify(response.schema, null, 2)}\n\`\`\`\n\n`;
      }
    }
    markdown += '\n';
  }

  return markdown;
}

function generateIndexMarkdown(modules, apiDoc) {
  const { info, host, basePath } = apiDoc;
  
  let markdown = `# ${info.title} Documentation

> **Version:** ${info.version}  
> **Base URL:** https://${host}${basePath}  
> **Description:** ${info.description}  
> **Last Updated:** ${new Date().toISOString()}

---

## 📚 API Modules

This documentation is organized by functional modules for easier navigation:

`;

  // Module list
  const moduleDescriptions = {
    'auth': '🔐 Authentication & authorization endpoints',
    'admin': '👑 Administrative functions and brand management',
    'billing': '💳 Bills, payments, and financial operations',
    'branches': '🏪 Branch management and operations',
    'cafe': '☕ Cafe table management and reservations',
    'cash': '💰 Cash register and shift management',
    'core': '⚙️ Core system endpoints',
    'i18n': '🌍 Internationalization and translations',
    'kitchen': '👨‍🍳 Recipe and kitchen management',
    'menu': '📋 Menu items, categories, and modifiers',
    'reports': '📊 Reporting and analytics',
    'staff': '👥 Staff management and operations',
    'users': '👤 User management and profiles',
    'warehouse': '📦 Inventory, stock, and warehouse management'
  };

  for (const [moduleName, modulePaths] of Object.entries(modules)) {
    const description = moduleDescriptions[moduleName] || `📁 ${moduleName} module`;
    const endpointCount = Object.keys(modulePaths).length;
    markdown += `### [${moduleName.toUpperCase()}](./${moduleName}/) - ${description}\n`;
    markdown += `*${endpointCount} endpoints*\n\n`;
    for (const endpointPath of Object.keys(modulePaths)) {
      const fileName = endpointPathToFileName(endpointPath);
      markdown += `- [\`${endpointPath}\`](./${moduleName}/${fileName}.md)\n`;
    }
    markdown += '\n';
  }

  markdown += `---

## 🔐 Authentication

Most endpoints require Bearer token authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

---

## 📊 Quick Stats

- **Total Modules**: ${Object.keys(modules).length}
- **Total Endpoints**: ${Object.values(modules).reduce((sum, module) => sum + Object.keys(module).length, 0)}

---

## 🚀 How to Update

Run the update script to refresh all documentation:

\`\`\`bash
./update-api-docs.sh
\`\`\`

---

## 📋 Data Models

Common data models are shared across modules. Refer to individual module documentation for specific model usage.

---

*This documentation is automatically generated from the Swagger/OpenAPI specification*  
*Last updated: ${new Date().toISOString()}*
`;

  return markdown;
}

function generateModularDocumentation(apiDoc) {
  const modules = groupEndpointsByModule(apiDoc.paths);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const [moduleName, modulePaths] of Object.entries(modules)) {
    const moduleDir = path.join(OUTPUT_DIR, moduleName);
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }

    for (const [endpointPath, methods] of Object.entries(modulePaths)) {
      const fileName = endpointPathToFileName(endpointPath);
      const fileContent = generateEndpointMarkdown(endpointPath, methods, apiDoc);
      fs.writeFileSync(path.join(moduleDir, `${fileName}.md`), fileContent, 'utf8');
    }

    console.log(`📝 Generated ${moduleName}/ (${Object.keys(modulePaths).length} endpoints)`);
  }

  const indexMarkdown = generateIndexMarkdown(modules, apiDoc);
  fs.writeFileSync(INDEX_FILE, indexMarkdown, 'utf8');
  console.log(`📋 Generated index documentation`);
}

async function main() {
  try {
    console.log('🚀 Starting modular API documentation fetch...');
    
    const apiDoc = await fetchApiDocs();
    console.log('✅ Successfully fetched API documentation');
    
    generateModularDocumentation(apiDoc);
    console.log('📝 Generated modular documentation');
    
    console.log(`💾 Documentation saved to: ${OUTPUT_DIR}/`);
    console.log('🎉 API documentation update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fetchApiDocs, generateModularDocumentation };
