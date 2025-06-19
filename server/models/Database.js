const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '../../data/doordash_tracker.db');
    
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  initializeTables() {
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
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
      )
    `;

    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date)',
      'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)'
    ];

    this.db.run(createOrdersTable, (err) => {
      if (err) {
        console.error('Error creating orders table:', err.message);
      } else {
        console.log('Orders table ready');
        
        // Create indexes
        createIndexes.forEach(indexQuery => {
          this.db.run(indexQuery, (err) => {
            if (err) console.error('Error creating index:', err.message);
          });
        });
      }
    });
  }

  // Order operations
  createOrder(orderData) {
    return new Promise((resolve, reject) => {
      const {
        date,
        start_time,
        end_time,
        duration_minutes,
        pay,
        miles,
        tip = 0,
        base_pay = 0,
        peak_pay = 0,
        notes = ''
      } = orderData;

      const query = `
        INSERT INTO orders (
          date, start_time, end_time, duration_minutes, 
          pay, miles, tip, base_pay, peak_pay, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [date, start_time, end_time, duration_minutes, pay, miles, tip, base_pay, peak_pay, notes],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...orderData });
          }
        }
      );
    });
  }

  createBulkOrders(ordersData) {
    return new Promise((resolve, reject) => {
      if (!ordersData || ordersData.length === 0) {
        resolve([]);
        return;
      }

      const results = [];
      let completed = 0;

      // Process orders one by one to avoid transaction issues
      const processOrder = (orderData) => {
        return new Promise((resolveOrder, rejectOrder) => {
          const {
            date, start_time, end_time, duration_minutes,
            pay, miles, tip = 0, base_pay = 0, peak_pay = 0, notes = ''
          } = orderData;

          const stmt = this.db.prepare(`
            INSERT INTO orders (
              date, start_time, end_time, duration_minutes, 
              pay, miles, tip, base_pay, peak_pay, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          stmt.run(
            [date, start_time, end_time, duration_minutes, pay, miles, tip, base_pay, peak_pay, notes],
            function(err) {
              stmt.finalize();
              if (err) {
                rejectOrder(err);
              } else {
                resolveOrder({ id: this.lastID, ...orderData });
              }
            }
          );
        });
      };

      // Process all orders sequentially
      const processAllOrders = async () => {
        try {
          for (const orderData of ordersData) {
            const result = await processOrder(orderData);
            results.push(result);
          }
          resolve(results);
        } catch (error) {
          reject(error);
        }
      };

      processAllOrders();
    });
  }

  getAllOrders(limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM orders 
        ORDER BY date DESC, start_time DESC 
        LIMIT ? OFFSET ?
      `;
      
      this.db.all(query, [limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getOrderById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM orders WHERE id = ?';
      
      this.db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  updateOrder(id, orderData) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(orderData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(orderData);
      values.push(id);

      const query = `
        UPDATE orders 
        SET ${fields}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

      this.db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, changes: this.changes, ...orderData });
        }
      });
    });
  }

  deleteOrder(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM orders WHERE id = ?';
      
      this.db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  // Analytics operations
  getDailyStats(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          date,
          COUNT(*) as total_orders,
          SUM(pay) as total_pay,
          SUM(miles) as total_miles,
          SUM(duration_minutes) as total_minutes,
          AVG(pay) as avg_pay_per_order,
          SUM(pay) / SUM(miles) as pay_per_mile,
          SUM(pay) / (SUM(duration_minutes) / 60.0) as pay_per_hour
        FROM orders 
        WHERE date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date DESC
      `;
      
      this.db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getHourlyStats(date) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          CAST(substr(start_time, 1, 2) AS INTEGER) as hour,
          COUNT(*) as total_orders,
          SUM(pay) as total_pay,
          SUM(miles) as total_miles,
          SUM(duration_minutes) as total_minutes,
          AVG(pay) as avg_pay_per_order
        FROM orders 
        WHERE date = ?
        GROUP BY hour
        ORDER BY hour
      `;
      
      this.db.all(query, [date], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getOverallStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(pay) as total_earnings,
          SUM(miles) as total_miles,
          SUM(duration_minutes) as total_minutes,
          AVG(pay) as avg_pay_per_order,
          SUM(pay) / SUM(miles) as avg_pay_per_mile,
          SUM(pay) / (SUM(duration_minutes) / 60.0) as avg_pay_per_hour,
          MIN(date) as first_order_date,
          MAX(date) as last_order_date
        FROM orders
      `;
      
      this.db.get(query, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
        resolve();
      });
    });
  }
}

module.exports = Database;