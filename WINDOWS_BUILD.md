# Windows Build Guide

## Prerequisites for Windows

### 1. Install Required Tools
```powershell
# Install Node.js (16.0 or higher)
# Download from: https://nodejs.org/

# Install Python 3.8-3.11 (NOT 3.12+)
# Download from: https://www.python.org/downloads/
# Make sure to check "Add Python to PATH"

# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2019
# Select "C++ build tools" workload
```

### 2. Configure npm for native modules
```powershell
npm config set python python
npm config set msvs_version 2019
```

## Fixed SQLite3 Issues

The original project used `sqlite3` which has compilation issues on Windows. We've switched to `better-sqlite3` which:
- Has better Windows support
- Doesn't require Python distutils
- Is faster and more reliable
- Has prebuilt binaries for most platforms

## Building the Application

### Option 1: Quick Build (Recommended)
```powershell
# Clean install
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install

# Build for Windows
npm run dist:win
```

**Recent Fixes Applied:**
- ✅ Replaced sqlite3 with better-sqlite3 (no more Python/distutils errors)
- ✅ Removed problematic afterSign notarize script reference
- ✅ Fixed electron.js main entry point configuration
- ✅ Added build preparation script for proper file copying

### Option 2: Step by Step
```powershell
# 1. Install dependencies
npm install

# 2. Build React app
npm run build

# 3. Package for Windows
npm run dist:win
```

### Option 3: If you still have issues
```powershell
# Force rebuild native modules
npm run rebuild

# Then try building again
npm run dist:win
```

## Troubleshooting Windows Issues

### 1. Python/distutils errors
**Solution**: We've replaced sqlite3 with better-sqlite3, so this should no longer occur.

### 2. Visual Studio Build Tools missing
```powershell
# Install Visual Studio Build Tools 2019
# Or install Visual Studio Community with C++ workload
```

### 3. Node-gyp errors
```powershell
# Clear npm cache
npm cache clean --force

# Reinstall with verbose logging
npm install --verbose
```

### 4. Permission errors
```powershell
# Run PowerShell as Administrator
# Or use Windows Subsystem for Linux (WSL)
```

### 5. Electron rebuild issues
```powershell
# Install electron-rebuild globally
npm install -g electron-rebuild

# Rebuild for Electron
electron-rebuild
```

## Development on Windows

### Using PowerShell
```powershell
# Start development
npm run dev:web

# Or use the easy starter
npm run dev:easy
```

### Using Command Prompt
```cmd
npm run dev:web
```

### Using WSL (Recommended for complex builds)
```bash
# Install WSL2 and Ubuntu
# Then follow the Linux instructions
npm install
npm run dev:web
```

## Build Output

After successful build, you'll find:
- `dist/DoorDash Tracker Setup.exe` - Windows installer
- `dist/win-unpacked/` - Unpacked application files

## Performance Tips for Windows

1. **Use SSD**: Build on SSD for faster compilation
2. **Exclude from antivirus**: Add project folder to antivirus exclusions
3. **Close unnecessary programs**: Free up RAM during build
4. **Use WSL2**: For better performance with Node.js builds

## Alternative: Portable Version

If you can't build the installer, you can run the app directly:

```powershell
# After npm run build
npm run server  # In one terminal
npm start       # In another terminal
# Then open http://localhost:3000 in browser
```

## Common Windows-Specific Commands

```powershell
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Python version
python --version

# List installed Visual Studio versions
npm config get msvs_version

# Check if build tools are available
npm config get python

# Force clean install
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

## Getting Help

If you're still having issues:

1. Check the error message carefully
2. Try the clean install steps above
3. Use WSL2 for a Linux-like environment
4. Consider using the web version instead of desktop app
5. Check GitHub issues for similar problems

## Success Indicators

You know the build worked when:
- No red error messages during `npm install`
- `npm run build` completes successfully
- `npm run dist:win` creates files in `dist/` folder
- The installer runs and installs the app
- The desktop app launches without errors