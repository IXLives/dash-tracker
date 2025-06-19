const express = require('express');
const Joi = require('joi');
const router = express.Router();

// Validation schemas
const dateRangeSchema = Joi.object({
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
});

const dateSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
});

// GET /api/analytics/overview - Get overall statistics
router.get('/overview', async (req, res) => {
  try {
    const stats = await req.db.getOverallStats();
    
    // Calculate additional metrics
    const response = {
      ...stats,
      avg_hours_per_day: stats.total_minutes ? (stats.total_minutes / 60) / 
        (new Date(stats.last_order_date) - new Date(stats.first_order_date)) * (1000 * 60 * 60 * 24) : 0,
      total_hours: stats.total_minutes ? stats.total_minutes / 60 : 0,
      total_days_active: stats.first_order_date && stats.last_order_date ? 
        Math.ceil((new Date(stats.last_order_date) - new Date(stats.first_order_date)) / (1000 * 60 * 60 * 24)) + 1 : 0
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ error: 'Failed to fetch overview statistics' });
  }
});

// GET /api/analytics/daily - Get daily statistics for date range
router.get('/daily', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }

    const { error } = dateRangeSchema.validate({ startDate, endDate });
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD', 
        details: error.details.map(d => d.message)
      });
    }

    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'startDate cannot be after endDate' });
    }

    const stats = await req.db.getDailyStats(startDate, endDate);
    
    // Add calculated fields
    const enhancedStats = stats.map(day => ({
      ...day,
      total_hours: day.total_minutes / 60,
      efficiency_score: day.pay_per_hour && day.pay_per_mile ? 
        (day.pay_per_hour * 0.6 + day.pay_per_mile * 0.4) : 0
    }));

    res.json(enhancedStats);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ error: 'Failed to fetch daily statistics' });
  }
});

// GET /api/analytics/hourly - Get hourly statistics for a specific date
router.get('/hourly', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ 
        error: 'date query parameter is required' 
      });
    }

    const { error } = dateSchema.validate({ date });
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD', 
        details: error.details.map(d => d.message)
      });
    }

    const stats = await req.db.getHourlyStats(date);
    
    // Fill in missing hours with zero values and add calculated fields
    const hourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = stats.find(s => s.hour === hour) || {
        hour,
        total_orders: 0,
        total_pay: 0,
        total_miles: 0,
        total_minutes: 0,
        avg_pay_per_order: 0
      };
      
      hourlyData.push({
        ...hourData,
        total_hours: hourData.total_minutes / 60,
        pay_per_hour: hourData.total_minutes > 0 ? 
          hourData.total_pay / (hourData.total_minutes / 60) : 0,
        pay_per_mile: hourData.total_miles > 0 ? 
          hourData.total_pay / hourData.total_miles : 0
      });
    }

    res.json(hourlyData);
  } catch (error) {
    console.error('Error fetching hourly stats:', error);
    res.status(500).json({ error: 'Failed to fetch hourly statistics' });
  }
});

// GET /api/analytics/trends - Get trend data for charts
router.get('/trends', async (req, res) => {
  try {
    const { startDate, endDate, metric = 'pay_per_hour' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }

    const { error } = dateRangeSchema.validate({ startDate, endDate });
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD', 
        details: error.details.map(d => d.message)
      });
    }

    const validMetrics = ['pay_per_hour', 'pay_per_mile', 'total_pay', 'total_orders', 'avg_pay_per_order'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ 
        error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}` 
      });
    }

    const dailyStats = await req.db.getDailyStats(startDate, endDate);
    
    // Calculate moving averages
    const trendData = dailyStats.map((day, index) => {
      const last7Days = dailyStats.slice(Math.max(0, index - 6), index + 1);
      const movingAvg = last7Days.reduce((sum, d) => sum + (d[metric] || 0), 0) / last7Days.length;
      
      return {
        date: day.date,
        value: day[metric] || 0,
        movingAverage: movingAvg,
        totalOrders: day.total_orders,
        totalPay: day.total_pay
      };
    });

    res.json({
      metric,
      data: trendData.reverse(), // Most recent first
      summary: {
        average: trendData.reduce((sum, d) => sum + d.value, 0) / trendData.length,
        highest: Math.max(...trendData.map(d => d.value)),
        lowest: Math.min(...trendData.map(d => d.value)),
        trend: trendData.length > 1 ? 
          (trendData[trendData.length - 1].value - trendData[0].value) / trendData[0].value * 100 : 0
      }
    });
  } catch (error) {
    console.error('Error fetching trend data:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
});

// GET /api/analytics/performance - Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }

    const { error } = dateRangeSchema.validate({ startDate, endDate });
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD', 
        details: error.details.map(d => d.message)
      });
    }

    const dailyStats = await req.db.getDailyStats(startDate, endDate);
    
    if (dailyStats.length === 0) {
      return res.json({
        bestDay: null,
        worstDay: null,
        averages: {
          payPerHour: 0,
          payPerMile: 0,
          ordersPerDay: 0,
          hoursPerDay: 0
        },
        totals: {
          earnings: 0,
          orders: 0,
          miles: 0,
          hours: 0
        }
      });
    }

    // Find best and worst performing days
    const bestDay = dailyStats.reduce((best, day) => 
      day.pay_per_hour > best.pay_per_hour ? day : best
    );
    
    const worstDay = dailyStats.reduce((worst, day) => 
      day.pay_per_hour < worst.pay_per_hour ? day : worst
    );

    // Calculate averages and totals
    const totals = dailyStats.reduce((acc, day) => ({
      earnings: acc.earnings + day.total_pay,
      orders: acc.orders + day.total_orders,
      miles: acc.miles + day.total_miles,
      hours: acc.hours + (day.total_minutes / 60)
    }), { earnings: 0, orders: 0, miles: 0, hours: 0 });

    const averages = {
      payPerHour: totals.hours > 0 ? totals.earnings / totals.hours : 0,
      payPerMile: totals.miles > 0 ? totals.earnings / totals.miles : 0,
      ordersPerDay: totals.orders / dailyStats.length,
      hoursPerDay: totals.hours / dailyStats.length
    };

    res.json({
      bestDay: {
        ...bestDay,
        total_hours: bestDay.total_minutes / 60
      },
      worstDay: {
        ...worstDay,
        total_hours: worstDay.total_minutes / 60
      },
      averages,
      totals,
      daysAnalyzed: dailyStats.length
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

module.exports = router;