import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import EarningsChart from '../components/Dashboard/EarningsChart';
import PerformanceMetrics from '../components/Dashboard/PerformanceMetrics';
import HourlyAnalysis from '../components/Analytics/HourlyAnalysis';
import TrendAnalysis from '../components/Analytics/TrendAnalysis';
import ComparisonChart from '../components/Analytics/ComparisonChart';
import { useApi } from '../hooks/useApi';
import './Analytics.css';

const Analytics = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('pay_per_hour');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    daily: [],
    hourly: [],
    trends: null,
    performance: null
  });

  const api = useApi();

  const dateRangeOptions = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const metricOptions = [
    { value: 'pay_per_hour', label: 'Pay per Hour' },
    { value: 'pay_per_mile', label: 'Pay per Mile' },
    { value: 'total_pay', label: 'Total Earnings' },
    { value: 'total_orders', label: 'Total Orders' },
    { value: 'avg_pay_per_order', label: 'Avg Pay per Order' }
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const today = new Date();
    
    switch (dateRange) {
      case '7days':
        return {
          startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        };
      case '30days':
        return {
          startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        };
      case '90days':
        return {
          startDate: format(subDays(today, 90), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        };
      case 'thisWeek':
        return {
          startDate: format(startOfWeek(today), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(today), 'yyyy-MM-dd')
        };
      case 'thisMonth':
        return {
          startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(today), 'yyyy-MM-dd')
        };
      case 'custom':
        return {
          startDate: customStartDate || format(subDays(today, 30), 'yyyy-MM-dd'),
          endDate: customEndDate || format(today, 'yyyy-MM-dd')
        };
      default:
        return {
          startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        };
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    
    try {
      const { startDate, endDate } = getDateRange();
      
      // Load all analytics data in parallel
      const [overview, daily, trends, performance] = await Promise.all([
        api.get('/analytics/overview'),
        api.get(`/analytics/daily?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/analytics/trends?startDate=${startDate}&endDate=${endDate}&metric=${selectedMetric}`),
        api.get(`/analytics/performance?startDate=${startDate}&endDate=${endDate}`)
      ]);

      // Load hourly data for the most recent date with data
      let hourly = [];
      if (daily.length > 0) {
        const mostRecentDate = daily[0].date;
        hourly = await api.get(`/analytics/hourly?date=${mostRecentDate}`);
      }

      setData({
        overview,
        daily,
        hourly,
        trends,
        performance
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    const { startDate, endDate } = getDateRange();
    
    // Create CSV content
    const csvContent = [
      ['Date', 'Orders', 'Earnings', 'Miles', 'Hours', 'Pay/Hour', 'Pay/Mile', 'Avg Pay/Order'],
      ...data.daily.map(day => [
        day.date,
        day.total_orders,
        day.total_pay.toFixed(2),
        day.total_miles.toFixed(1),
        (day.total_minutes / 60).toFixed(1),
        day.pay_per_hour.toFixed(2),
        day.pay_per_mile.toFixed(2),
        day.avg_pay_per_order.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doordash-analytics-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="analytics-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="analytics-header" variants={itemVariants}>
        <div className="analytics-title">
          <h1>Analytics</h1>
          <p>Detailed insights into your DoorDash performance</p>
        </div>
        <div className="analytics-actions">
          <button
            className="btn btn-secondary"
            onClick={loadAnalyticsData}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportData}
            disabled={data.daily.length === 0}
          >
            <Download size={16} />
            Export Data
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div className="analytics-filters" variants={itemVariants}>
        <div className="filter-group">
          <div className="filter-item">
            <label className="filter-label">
              <Calendar size={16} />
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="form-input"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div className="filter-item">
                <label className="filter-label">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="filter-item">
                <label className="filter-label">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </>
          )}

          <div className="filter-item">
            <label className="filter-label">
              <TrendingUp size={16} />
              Primary Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="form-input"
            >
              {metricOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Analytics Content */}
      <div className="analytics-content">
        {data.daily.length === 0 ? (
          <motion.div className="analytics-empty" variants={itemVariants}>
            <BarChart3 size={48} />
            <h3>No data available</h3>
            <p>No orders found for the selected date range. Try adjusting your filters or add some orders first.</p>
          </motion.div>
        ) : (
          <>
            {/* Main Charts Row */}
            <div className="charts-row">
              <motion.div className="chart-section" variants={itemVariants}>
                <EarningsChart 
                  data={data.daily} 
                  timeRange={dateRange}
                />
              </motion.div>
              
              <motion.div className="chart-section" variants={itemVariants}>
                <TrendAnalysis 
                  data={data.trends}
                  metric={selectedMetric}
                  dateRange={dateRange}
                />
              </motion.div>
            </div>

            {/* Secondary Charts Row */}
            <div className="charts-row">
              <motion.div className="chart-section" variants={itemVariants}>
                <HourlyAnalysis 
                  data={data.hourly}
                  date={data.daily.length > 0 ? data.daily[0].date : null}
                />
              </motion.div>
              
              <motion.div className="chart-section" variants={itemVariants}>
                <ComparisonChart 
                  data={data.daily}
                  performance={data.performance}
                />
              </motion.div>
            </div>

            {/* Performance Metrics */}
            <motion.div className="performance-section" variants={itemVariants}>
              <PerformanceMetrics 
                overviewStats={data.overview}
                timeRangeStats={data.performance?.totals}
                dailyStats={data.daily}
              />
            </motion.div>

            {/* Detailed Statistics */}
            <motion.div className="stats-section" variants={itemVariants}>
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Best Day</h4>
                  {data.performance?.bestDay ? (
                    <div className="stat-content">
                      <div className="stat-value">
                        {format(new Date(data.performance.bestDay.date), 'MMM d, yyyy')}
                      </div>
                      <div className="stat-details">
                        <span>${data.performance.bestDay.total_pay.toFixed(2)} earned</span>
                        <span>${data.performance.bestDay.pay_per_hour.toFixed(2)}/hour</span>
                        <span>{data.performance.bestDay.total_orders} orders</span>
                      </div>
                    </div>
                  ) : (
                    <div className="stat-content">
                      <div className="stat-value">No data</div>
                    </div>
                  )}
                </div>

                <div className="stat-card">
                  <h4>Averages</h4>
                  <div className="stat-content">
                    <div className="stat-details">
                      <span>${data.performance?.averages?.payPerHour?.toFixed(2) || '0.00'}/hour</span>
                      <span>${data.performance?.averages?.payPerMile?.toFixed(2) || '0.00'}/mile</span>
                      <span>{data.performance?.averages?.ordersPerDay?.toFixed(1) || '0'} orders/day</span>
                      <span>{data.performance?.averages?.hoursPerDay?.toFixed(1) || '0'} hours/day</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <h4>Totals</h4>
                  <div className="stat-content">
                    <div className="stat-details">
                      <span>${data.performance?.totals?.earnings?.toFixed(2) || '0.00'} earned</span>
                      <span>{data.performance?.totals?.orders || 0} orders</span>
                      <span>{data.performance?.totals?.miles?.toFixed(1) || '0'} miles</span>
                      <span>{data.performance?.totals?.hours?.toFixed(1) || '0'} hours</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <h4>Analysis Period</h4>
                  <div className="stat-content">
                    <div className="stat-details">
                      <span>{data.performance?.daysAnalyzed || 0} days analyzed</span>
                      <span>{dateRangeOptions.find(opt => opt.value === dateRange)?.label}</span>
                      <span>
                        {format(new Date(getDateRange().startDate), 'MMM d')} - {format(new Date(getDateRange().endDate), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Analytics;