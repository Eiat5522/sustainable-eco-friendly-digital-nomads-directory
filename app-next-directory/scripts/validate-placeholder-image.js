#!/usr/bin/env node

/**
 * @file validate-placeholder-image.js
 * @description Validation script to ensure placeholder image exists before build
 * This script can be run as part of the build process to catch missing assets early
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLACEHOLDER_PATH = path.join(__dirname, '..', 'public', 'placeholder_image.png');

function validatePlaceholderImage() {
  console.log('🔍 Validating placeholder image...');
  
  // Check if file exists
  if (!fs.existsSync(PLACEHOLDER_PATH)) {
    console.error('❌ CRITICAL ERROR: placeholder_image.png is missing!');
    console.error(`   Expected location: ${PLACEHOLDER_PATH}`);
    console.error('   This file is required for the fallback image system.');
    console.error('   See docs/FALLBACK_IMAGE_SYSTEM.md for details.');
    process.exit(1);
  }
  
  // Check if file is readable
  try {
    const stats = fs.statSync(PLACEHOLDER_PATH);
    
    if (!stats.isFile()) {
      console.error('❌ CRITICAL ERROR: placeholder_image.png exists but is not a file!');
      process.exit(1);
    }
    
    if (stats.size === 0) {
      console.error('❌ CRITICAL ERROR: placeholder_image.png is empty!');
      process.exit(1);
    }
    
    // Check PNG signature
    const buffer = fs.readFileSync(PLACEHOLDER_PATH);
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    
    if (buffer.length < 8) {
      console.error('❌ CRITICAL ERROR: placeholder_image.png is too small to be a valid PNG!');
      process.exit(1);
    }
    
    for (let i = 0; i < pngSignature.length; i++) {
      if (buffer[i] !== pngSignature[i]) {
        console.error('❌ CRITICAL ERROR: placeholder_image.png is not a valid PNG file!');
        process.exit(1);
      }
    }
    
    console.log('✅ Placeholder image validation passed');
    console.log(`   File size: ${Math.round(stats.size / 1024 * 100) / 100} KB`);
    console.log(`   Location: ${PLACEHOLDER_PATH}`);
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR: Cannot read placeholder_image.png!');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validatePlaceholderImage();
}

export { validatePlaceholderImage };