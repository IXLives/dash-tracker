#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting DoorDash Tracker Development Environment...\n');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  const install = spawn('npm', ['install'], { stdio: 'inherit' });
  install.on('close', (code) => {
    if (code === 0) {
      startDevelopment();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startDevelopment();
}

function startDevelopment() {
  console.log('🔧 Starting development servers...\n');
  
  // Check if data directory exists
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
    console.log('📁 Created data directory');
  }

  console.log('🌐 Starting web development mode...');
  console.log('   - Server will run on: http://localhost:12001');
  console.log('   - React app will run on: http://localhost:3000');
  console.log('   - Health check: http://localhost:12001/api/health\n');
  
  const dev = spawn('npm', ['run', 'dev:web'], { stdio: 'inherit' });
  
  dev.on('close', (code) => {
    console.log(`\n🛑 Development servers stopped with code ${code}`);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development servers...');
    dev.kill('SIGINT');
    process.exit(0);
  });
}