# DoorDash Tracker

A comprehensive desktop application for tracking DoorDash delivery profits and performance metrics. Built with React, Electron, and Express with SQLite database.

![DoorDash Tracker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![Electron](https://img.shields.io/badge/Electron-22.3.27-blue.svg)

## Features

### 📊 Dashboard
- Real-time earnings overview with key performance indicators
- Interactive charts showing earnings trends
- Performance metrics with efficiency scoring
- Recent orders display with detailed breakdown

### 📦 Order Management
- Add single orders with comprehensive details
- Bulk import orders from CSV files
- Edit and delete existing orders
- Advanced filtering and search capabilities

### 📈 Analytics
- Hourly analysis with peak performance identification
- Daily, weekly, and monthly trend analysis
- Comparison charts for different time periods
- Pay per hour and pay per mile tracking
- Efficiency scoring and performance insights

### ⚙️ Settings & Data Management
- Export all data to CSV format
- Import historical data from CSV files
- Clear all data with confirmation
- Server connection testing
- Application information and tips

## Technology Stack

### Frontend
- **React 18.2.0** - Modern UI framework
- **React Router DOM** - Client-side routing
- **Recharts** - Interactive charts and visualizations
- **Framer Motion** - Smooth animations and transitions
- **React Hook Form** - Form handling and validation
- **React Hot Toast** - User notifications
- **Lucide React** - Modern icon library
- **date-fns** - Date manipulation utilities

### Backend
- **Express 4.18.2** - Web server framework
- **SQLite3** - Local database storage
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logging

### Desktop
- **Electron 22.3.27** - Cross-platform desktop app
- **Electron Builder** - Application packaging

### Development Tools
- **Concurrently** - Run multiple commands
- **Wait-on** - Wait for services to be ready
- **Testing Library** - Component testing
- **Jest** - Test runner

## Installation

### Prerequisites
- Node.js 16.0 or higher
- npm or yarn package manager

### Quick Start
1. Clone the repository:
```bash
git clone https://github.com/IXLives/dash-tracker.git
cd dash-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start development (choose one):

**Option A: Web Development (Recommended)**
```bash
npm run dev:web
```
- Express server: http://localhost:12001
- React app: http://localhost:3000

**Option B: Full Desktop App**
```bash
npm run dev
```
- Starts server + React + Electron desktop app

### Troubleshooting
If you encounter issues, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed troubleshooting guide.

## Usage

### Development Mode
```bash
# Start all services (recommended)
npm run dev

# Start individual services
npm run server    # Express server only
npm start        # React app only
npm run electron # Electron app only
```

### Production Build
```bash
# Build React app
npm run build

# Package Electron app
npm run dist
```

### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## API Endpoints

### Orders
- `GET /api/orders` - Get all orders with pagination
- `POST /api/orders` - Create a new order
- `POST /api/orders/bulk` - Create multiple orders
- `PUT /api/orders/:id` - Update an order
- `DELETE /api/orders/:id` - Delete an order

### Analytics
- `GET /api/analytics/overview` - Get overall statistics
- `GET /api/analytics/daily` - Get daily analytics
- `GET /api/analytics/hourly` - Get hourly performance data

### System
- `GET /api/health` - Health check endpoint

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  pay REAL NOT NULL,
  miles REAL NOT NULL,
  tip REAL DEFAULT 0,
  base_pay REAL DEFAULT 0,
  peak_pay REAL DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
doordash-tracker/
├── public/
│   ├── electron.js          # Electron main process
│   ├── index.html          # HTML template
│   └── manifest.json       # PWA manifest
├── server/
│   ├── models/
│   │   └── Database.js     # SQLite database operations
│   ├── routes/
│   │   ├── analytics.js    # Analytics endpoints
│   │   └── orders.js       # Order CRUD endpoints
│   └── index.js           # Express server setup
├── src/
│   ├── components/
│   │   ├── analytics/      # Analytics components
│   │   ├── forms/         # Form components
│   │   └── Layout.js      # Main layout component
│   ├── hooks/
│   │   └── useApi.js      # API communication hook
│   ├── pages/
│   │   ├── Analytics.js   # Analytics page
│   │   ├── Dashboard.js   # Dashboard page
│   │   ├── Orders.js      # Orders management page
│   │   └── Settings.js    # Settings page
│   ├── App.js             # Main React component
│   ├── App.css           # Global styles
│   └── index.js          # React entry point
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Key Features Explained

### Performance Metrics
- **Efficiency Score**: Calculated based on pay per hour and pay per mile
- **Consistency Rating**: Measures variance in earnings across sessions
- **Peak Hour Analysis**: Identifies most profitable time periods

### Data Import/Export
- **CSV Format**: Compatible with common spreadsheet applications
- **Bulk Operations**: Import hundreds of orders at once
- **Data Validation**: Ensures data integrity during import

### Responsive Design
- **Mobile-First**: Optimized for various screen sizes
- **DoorDash Theme**: Consistent with DoorDash brand colors
- **Accessibility**: WCAG compliant with keyboard navigation

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## Testing

The application includes comprehensive tests:

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full application workflow testing

Run tests with:
```bash
npm test
```

## Performance Optimization

- **Code Splitting**: Lazy loading of route components
- **Memoization**: React.memo for expensive components
- **Database Indexing**: Optimized SQLite queries
- **Caching**: API response caching for better performance

## Security

- **Input Validation**: All user inputs are validated
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Proper cross-origin settings
- **Data Sanitization**: Clean user data before storage

## Deployment

### Desktop App
```bash
npm run dist
```

### Web App
```bash
npm run build
# Deploy build/ folder to web server
```

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue on the GitHub repository or contact the development team.

## Roadmap

- [ ] Cloud synchronization
- [ ] Mobile companion app
- [ ] Advanced reporting features
- [ ] Multi-platform delivery service support
- [ ] Machine learning insights
- [ ] Team collaboration features

---

Built with ❤️ for DoorDash drivers by drivers