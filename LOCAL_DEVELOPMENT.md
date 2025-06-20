# Local Development Guide

## Quick Start

### Option 1: Web Development (Recommended for testing)
```bash
npm install
npm run dev:web
```
This starts:
- Express server on http://localhost:12001
- React app on http://localhost:3000

### Option 2: Full Desktop App
```bash
npm install
npm run dev
```
This starts all three services:
- Express server on http://localhost:12001
- React app on http://localhost:3000
- Electron desktop app

### Option 3: Individual Services
```bash
# Backend only
npm run dev:server

# Frontend only
npm start

# Desktop app only (requires backend + frontend running)
npm run electron
```

## Troubleshooting Common Issues

### 1. API Calls Failing
**Problem**: All API calls return 404 or connection errors

**Solutions**:
- Ensure the server is running on port 12001
- Check if `http://localhost:12001/api/health` returns `{"status":"OK"}`
- Verify no other service is using port 12001

```bash
# Test server health
curl http://localhost:12001/api/health

# Check what's running on port 12001
lsof -i :12001  # macOS/Linux
netstat -ano | findstr :12001  # Windows
```

### 2. Database Issues
**Problem**: Database errors or missing data

**Solutions**:
- Delete the database file and restart: `rm data/doordash_tracker.db`
- The database will be recreated automatically with sample data

### 3. Port Conflicts
**Problem**: "Port already in use" errors

**Solutions**:
```bash
# Kill processes on specific ports
# macOS/Linux:
lsof -ti:3000 | xargs kill -9
lsof -ti:12001 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 4. Module Installation Issues
**Problem**: npm install fails or modules missing

**Solutions**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force

# Windows users: See WINDOWS_BUILD.md for SQLite3 issues
```

**Note**: We've switched from `sqlite3` to `better-sqlite3` to fix Windows compilation issues.

### 5. Electron Issues
**Problem**: Electron app won't start or crashes

**Solutions**:
- Ensure React app is running first on port 3000
- Check Electron version compatibility
- Try rebuilding native modules:
```bash
npm run electron-rebuild
```

### 6. CORS Issues
**Problem**: Cross-origin request blocked

**Solutions**:
- The server is configured for `http://localhost:3000`
- If using different ports, update `server/index.js` CORS config:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:YOUR_PORT'],
  credentials: true
}));
```

## Environment Variables

Create a `.env` file in the root directory for custom configuration:

```env
# Server
PORT=12001
NODE_ENV=development

# Database
DB_PATH=./data/doordash_tracker.db

# React App (must start with REACT_APP_)
REACT_APP_API_URL=http://localhost:12001/api
```

## Development Workflow

### 1. Making Changes
- **Frontend**: Edit files in `src/`, changes auto-reload
- **Backend**: Edit files in `server/`, restart with `npm run dev:server`
- **Database**: Changes persist in `data/doordash_tracker.db`

### 2. Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Test API endpoints
curl http://localhost:12001/api/health
curl http://localhost:12001/api/orders
```

### 3. Building for Production
```bash
# Web build
npm run build

# Desktop app
npm run dist
```

## File Structure for Development

```
doordash-tracker/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom hooks (API calls)
│   └── styles/            # CSS files
├── server/                # Express backend
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   └── index.js           # Server entry point
├── public/                # Static files + Electron main
├── data/                  # SQLite database
└── build/                 # Production build output
```

## API Endpoints for Testing

### Health Check
```bash
curl http://localhost:12001/api/health
```

### Orders
```bash
# Get all orders
curl http://localhost:12001/api/orders

# Create order
curl -X POST http://localhost:12001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-01-15","start_time":"18:00","end_time":"19:30","duration_minutes":90,"pay":25.50,"miles":12.3}'
```

### Analytics
```bash
# Overview stats
curl http://localhost:12001/api/analytics/overview

# Daily analytics
curl http://localhost:12001/api/analytics/daily
```

## Common Development Commands

```bash
# Install dependencies
npm install

# Start development (web only)
npm run dev:web

# Start full development (with Electron)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Package desktop app
npm run dist

# Clean restart
rm -rf node_modules package-lock.json data/doordash_tracker.db
npm install
npm run dev:web
```

## Performance Tips

1. **Use dev:web for faster development** - Electron adds overhead
2. **Keep database small** - Delete old test data regularly
3. **Use React DevTools** - Install browser extension for debugging
4. **Monitor console** - Check browser and terminal for errors

## Getting Help

If you're still having issues:

1. Check the browser console for JavaScript errors
2. Check the terminal for server errors
3. Verify all ports are available and services are running
4. Try the clean restart commands above
5. Check this file for similar issues

## Next Steps

Once everything is working locally:
- Add your own orders through the UI
- Explore the analytics features
- Customize the styling in `src/styles/`
- Add new features by modifying components
- Test the desktop app with `npm run dev`