#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing build...');

// Ensure build directory exists
const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy electron.js to build directory
const electronSrc = path.join(__dirname, '../public/electron.js');
const electronDest = path.join(buildDir, 'electron.js');

try {
  fs.copyFileSync(electronSrc, electronDest);
  console.log('✅ Copied electron.js to build directory');
} catch (err) {
  console.error('❌ Failed to copy electron.js:', err.message);
  process.exit(1);
}

console.log('✅ Build preparation complete');