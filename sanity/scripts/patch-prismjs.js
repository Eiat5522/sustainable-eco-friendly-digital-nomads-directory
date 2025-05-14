#!/usr/bin/env node

/**
 * This script patches nested PrismJS dependencies to use version 1.30.0 or higher
 * It directly modifies the node_modules structure after installation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define the paths we need to check
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const nodeModulesDir = path.join(rootDir, 'node_modules');

// Get all instances of package.json files with prismjs as a dependency
console.log('Scanning for vulnerable PrismJS dependencies...');

// Helper function to recursively find all package.json files
function findPackageJsons(dir, depth = 0, maxDepth = 5) {
  if (depth > maxDepth) return [];
  
  const results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Skip certain directories
      if (item === '.bin' || item === '.cache' || item === '.git') continue;
      
      const packageJsonPath = path.join(itemPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        results.push(packageJsonPath);
      }
      
      // Recursively search nested node_modules
      const nestedNodeModules = path.join(itemPath, 'node_modules');
      if (fs.existsSync(nestedNodeModules)) {
        results.push(...findPackageJsons(nestedNodeModules, depth + 1, maxDepth));
      }
    }
  }
  
  return results;
}

// Find all package.json files in node_modules
const packageJsonPaths = findPackageJsons(nodeModulesDir);
console.log(`Found ${packageJsonPaths.length} package.json files`);

// Check each package.json for prismjs dependency
let patchedCount = 0;
for (const packageJsonPath of packageJsonPaths) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if this package has prismjs as a dependency
    const hasPrismjs = packageJson.dependencies && packageJson.dependencies.prismjs;
    if (hasPrismjs) {
      const currentVersion = packageJson.dependencies.prismjs;
      
      // Parse the version to check if it's vulnerable
      const versionMatch = currentVersion.match(/[0-9]+\.[0-9]+\.[0-9]+/);
      if (versionMatch) {
        const version = versionMatch[0];
        const [major, minor, patch] = version.split('.').map(Number);
        
        // Check if it's less than 1.30.0
        if (major < 1 || (major === 1 && minor < 30)) {
          console.log(`Found vulnerable PrismJS ${version} in ${packageJsonPath}`);
          
          // Update the version in the package.json
          packageJson.dependencies.prismjs = '^1.30.0';
          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
          patchedCount++;
          
          // Get the directory where prismjs is installed
          const packageDir = path.dirname(packageJsonPath);
          const prismjsDir = path.join(packageDir, 'node_modules', 'prismjs');
          
          // Install the correct version if the directory exists
          if (fs.existsSync(prismjsDir)) {
            console.log(`Installing PrismJS 1.30.0 in ${prismjsDir}`);
            const npmCmd = 'npm install prismjs@1.30.0 --no-save';
            try {
              execSync(npmCmd, { cwd: packageDir, stdio: 'inherit' });
            } catch (e) {
              console.error(`Failed to install PrismJS in ${packageDir}:`, e.message);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error processing ${packageJsonPath}:`, err.message);
  }
}

console.log(`Patched ${patchedCount} vulnerable PrismJS dependencies`);
console.log('Done!');
