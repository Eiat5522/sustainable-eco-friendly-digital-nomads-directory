// Import and file existence validator for CI pipelines.

import fs from 'fs';
import path from 'path';

/**
 * Recursively finds all .ts and .tsx files in a directory.
 */
function findSourceFiles(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      findSourceFiles(fullPath, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Validates that all import paths in a file exist.
 */
function validateImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex =
    /import\s+(?:[\w*\s{},]+from\s+)?['"]([^'"]+)['"];?/g;
  const errors: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content))) {
    const importPath = match[1];
    if (
      importPath.startsWith('.') &&
      !fs.existsSync(
        require.resolve(path.resolve(path.dirname(filePath), importPath))
      )
    ) {
      errors.push(
        `Missing import target: ${importPath} in ${filePath}`
      );
    }
  }
  return errors;
}

/**
 * Main entry for CI.
 */
function main() {
  const srcDir = path.resolve(__dirname, '../../src');
  const files = findSourceFiles(srcDir);
  let hasError = false;
  for (const file of files) {
    const errors = validateImports(file);
    if (errors.length) {
      hasError = true;
      errors.forEach((err) => console.error(err));
    }
  }
  if (hasError) {
    process.exit(1);
  } else {
    console.log('All imports validated successfully.');
  }
}

if (require.main === module) {
  main();
}