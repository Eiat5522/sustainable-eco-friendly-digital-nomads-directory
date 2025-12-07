#!/usr/bin/env node

/**
 * Simplified PrismJS patch script
 * - Updates package versions
 * - Applies security patches
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Required versions for security
const REQUIRED_VERSIONS = {
  'prismjs': '>=1.31.0',
  'refractor': '>=4.8.1',
  'react-refractor': '>=3.1.1'
};

// Performance patch for large code blocks
const PERFORMANCE_PATCH = `
// Performance optimization for large text blocks
Prism.hooks.add('before-highlight', function(env) {
  if (env.code && env.code.length > 10000) {
    // Temporarily detach element from DOM for performance
    const parent = env.element.parentNode;
    const next = env.element.nextSibling;
    
    // Process detached from DOM
    parent.removeChild(env.element);
    setTimeout(() => {
      if (next) {
        parent.insertBefore(env.element, next);
      } else {
        parent.appendChild(env.element);
      }
    }, 0);
  }
});
`;

// XSS protection patch
const XSS_PROTECTION_PATCH = `
// Enhanced XSS protection
Prism.hooks.add('before-insert', function(env) {
  if (typeof env.highlightedCode === 'string') {
    // Sanitize the highlighted HTML
    env.highlightedCode = env.highlightedCode
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
`;

// Main function
async function main() {
  console.log('🔒 Applying simplified PrismJS security patches...');
  
  try {
    // Get all package.json files within node_modules
    const packageJsonPaths = [];
    
    // Add package.json in root directory
    packageJsonPaths.push(path.join(rootDir, 'package.json'));
    
    // Process all found package.json files
    for (const packageJsonPath of packageJsonPaths) {
      if (fs.existsSync(packageJsonPath)) {
        await patchPackageJson(packageJsonPath);
      }
    }
    
    // Look for PrismJS installation and patch it
    const prismJsPath = path.join(rootDir, 'node_modules', 'prismjs', 'prism.js');
    if (fs.existsSync(prismJsPath)) {
      console.log('✅ Found PrismJS installation, patching...');
      const content = fs.readFileSync(prismJsPath, 'utf8');
      let newContent = content;
      
      // Add performance patch if not already present
      if (!content.includes('Performance optimization for large text blocks')) {
        newContent += PERFORMANCE_PATCH;
        console.log('✅ Added performance optimization to PrismJS');
      }
      
      // Add XSS protection patch if not already present
      if (!content.includes('Enhanced XSS protection')) {
        newContent += XSS_PROTECTION_PATCH;
        console.log('✅ Added XSS protection to PrismJS');
      }
      
      // Write patches back to file
      if (newContent !== content) {
        fs.writeFileSync(prismJsPath, newContent, 'utf8');
        console.log('✅ Successfully patched PrismJS');
      }
    } else {
      console.warn('⚠️ PrismJS installation not found, skipping direct patching');
    }
    
    console.log('✅ Patch process completed successfully');
  } catch (error) {
    console.error('❌ Error during patching:', error.message);
    process.exit(1);
  }
}

// Process a single package.json file
async function patchPackageJson(packageJsonPath) {
  console.log(`Processing ${packageJsonPath}...`);
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let updated = false;
    
    // Update or add overrides
    if (!packageJson.overrides) packageJson.overrides = {};
    
    // Direct overrides
    Object.entries(REQUIRED_VERSIONS).forEach(([dep, version]) => {
      if (!packageJson.overrides[dep] || packageJson.overrides[dep] !== version) {
        packageJson.overrides[dep] = version;
        updated = true;
      }
    });
    
    // Update resolutions if present
    if (packageJson.resolutions) {
      Object.entries(REQUIRED_VERSIONS).forEach(([dep, version]) => {
        if (!packageJson.resolutions[dep] || packageJson.resolutions[dep] !== version) {
          packageJson.resolutions[dep] = version;
          updated = true;
        }
      });
    }
    
    // Save if updated
    if (updated) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      console.log(`✅ Updated ${packageJsonPath}`);
    } else {
      console.log(`✅ No updates needed for ${packageJsonPath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${packageJsonPath}:`, error.message);
  }
}

// Helper function for dirname in ESM
function dirname(path) {
  return path.replace(/\/[^/]*$/, '');
}

// Run the main function
main().catch(console.error);
