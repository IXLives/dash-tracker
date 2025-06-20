const Database = require('better-sqlite3');
const path = require('path');

class DatabaseManager {
  constructor() {
    const dbPath = path.join(__dirname, '../../data/doordash_tracker.db');
    
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      this.db = new Database(dbPath);
      console.log('Connected to SQLite database');
      this.initializeTables();
    } catch (err) {
      console.error('Error opening database:', err.message);
      throw err;
    }
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

    try {
      this.db.exec(createOrdersTable);
      console.log('Orders table ready');
      
      // Create indexes
      createIndexes.forEach(indexQuery => {
        this.db.exec(indexQuery);
      });
    } catch (err) {
      console.error('Error creating tables:', err.message);
      throw err;
    }
  }

  // Order operations
  async createOrder(orderData) {
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
        date, start_time, end_time, duration_minutes, pay, miles, 
        tip, base_pay, peak_pay, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const stmt = this.db.prepare(query);
      const result = stmt.run(
        date, start_time, end_time, duration_minutes, pay, miles,
        tip, base_pay, peak_pay, notes
      );
      
      return { id: result.lastInsertRowid, ...orderData };
    } catch (err) {
      console.error('Error creating order:', err.message);
      throw err;
    }
  }

  async createOrdersBulk(orders) {
    const query = `
      INSERT INTO orders (
        date, start_time, end_time, duration_minutes, pay, miles, 
        tip, base_pay, peak_pay, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const stmt = this.db.prepare(query);
      const transaction = this.db.transaction((orders) => {
        const results = [];
        for (const order of orders) {
          const {
            date, start_time, end_time, duration_minutes, pay, miles,
            tip = 0, base_pay = 0, peak_pay = 0, notes = ''
          } = order;
          
          const result = stmt.run(
            date, start_time, end_time, duration_minutes, pay, miles,
            tip, base_pay, peak_pay, notes
          );
          results.push({ id: result.lastInsertRowid, ...order });
        }
        return results;
      });

      return transaction(orders);
    } catch (err) {
      console.error('Error creating bulk orders:', err.message);
      throw err;
    }
  }

  async getOrders(limit = 50, offset = 0, filters = {}) {
    let query = 'SELECT * FROM orders';
    const params = [];
    const conditions = [];

    // Add filters
    if (filters.startDate) {
      conditions.push('date >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('date <= ?');
      params.push(filters.endDate);
    }
    if (filters.minPay) {
      conditions.push('pay >= ?');
      params.push(filters.minPay);
    }
    if (filters.maxPay) {
      conditions.push('pay <= ?');
      params.push(filters.maxPay);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC, start_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const stmt = this.db.prepare(query);
      const orders = stmt.all(...params);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM orders';
      const countParams = [];
      
      if (conditions.length > 0) {
        countQuery += ' WHERE ' + conditions.join(' AND ');
        countParams.push(...params.slice(0, -2)); // Remove limit and offset
      }
      
      const countStmt = this.db.prepare(countQuery);
      const { total } = countStmt.get(...countParams);

      return { orders, total };
    } catch (err) {
      console.error('Error getting orders:', err.message);
      throw err;
    }
  }

  async getOrderById(id) {
    try {
      const stmt = this.db.prepare('SELECT * FROM orders WHERE id = ?');
      return stmt.get(id);
    } catch (err) {
      console.error('Error getting order by ID:', err.message);
      throw err;
    }
  }

  async updateOrder(id, orderData) {
    const {
      date, start_time, end_time, duration_minutes, pay, miles,
      tip, base_pay, peak_pay, notes
    } = orderData;

    const query = `
      UPDATE orders SET 
        date = ?, start_time = ?, end_time = ?, duration_minutes = ?, 
        pay = ?, miles = ?, tip = ?, base_pay = ?, peak_pay = ?, 
        notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const stmt = this.db.prepare(query);
      const result = stmt.run(
        date, start_time, end_time, duration_minutes, pay, miles,
        tip, base_pay, peak_pay, notes, id
      );

      if (result.changes === 0) {
        throw new Error('Order not found');
      }

      return this.getOrderById(id);
    } catch (err) {
      console.error('Error updating order:', err.message);
      throw err;
    }
  }

  async deleteOrder(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM orders WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error('Order not found');
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting order:', err.message);
      throw err;
    }
  }

  async clearAllOrders() {
    try {
      const stmt = this.db.prepare('DELETE FROM orders');
      const result = stmt.run();
      return { deletedCount: result.changes };
    } catch (err) {
      console.error('Error clearing orders:', err.message);
      throw err;
    }
  }

  // Analytics operations
  async getOverviewStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(pay) as total_earnings,
          SUM(duration_minutes) as total_minutes,
          SUM(miles) as total_miles,
          AVG(pay) as avg_pay,
          AVG(duration_minutes) as avg_duration,
          AVG(miles) as avg_miles,
          MIN(date) as first_order_date,
          MAX(date) as last_order_date
        FROM orders
      `;
      
      const stmt = this.db.prepare(query);
      return stmt.get();
    } catch (err) {
      console.error('Error getting overview stats:', err.message);
      throw err;
    }
  }

  async getDailyStats(days = 30) {
    try {
      const query = `
        SELECT 
          date,
          COUNT(*) as order_count,
          SUM(pay) as total_pay,
          SUM(duration_minutes) as total_minutes,
          SUM(miles) as total_miles,
          AVG(pay) as avg_pay,
          AVG(duration_minutes) as avg_duration,
          AVG(miles) as avg_miles
        FROM orders 
        WHERE date >= date('now', '-${days} days')
        GROUP BY date 
        ORDER BY date DESC
      `;
      
      const stmt = this.db.prepare(query);
      return stmt.all();
    } catch (err) {
      console.error('Error getting daily stats:', err.message);
      throw err;
    }
  }

  async getHourlyStats() {
    try {
      const query = `
        SELECT 
          CAST(substr(start_time, 1, 2) AS INTEGER) as hour,
          COUNT(*) as order_count,
          SUM(pay) as total_pay,
          SUM(duration_minutes) as total_minutes,
          SUM(miles) as total_miles,
          AVG(pay) as avg_pay,
          AVG(duration_minutes) as avg_duration,
          AVG(miles) as avg_miles
        FROM orders 
        GROUP BY hour 
        ORDER BY hour
      `;
      
      const stmt = this.db.prepare(query);
      return stmt.all();
    } catch (err) {
      console.error('Error getting hourly stats:', err.message);
      throw err;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }
}

module.exports = DatabaseManager;