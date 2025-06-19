import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Clock,
  MapPin,
  TrendingUp,
  Calendar,
  Target,
  Activity,
  Award
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import StatsCard from '../components/Dashboard/StatsCard';
import RecentOrders from '../components/Dashboard/RecentOrders';
import EarningsChart from '../components/Dashboard/EarningsChart';
import PerformanceMetrics from '../components/Dashboard/PerformanceMetrics';
import { useApi } from '../hooks/useApi';
import './Dashboard.css';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('7days');
  const [overviewStats, setOverviewStats] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(
        subDays(new Date(), timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90),
        'yyyy-MM-dd'
      );

      // Load all data in parallel
      const [overview, daily, orders] = await Promise.all([
        api.get('/analytics/overview'),
        api.get(`/analytics/daily?startDate=${startDate}&endDate=${endDate}`),
        api.get('/orders?limit=10')
      ]);

      setOverviewStats(overview);
      setDailyStats(daily);
      setRecentOrders(orders.orders || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeStats = () => {
    if (!dailyStats.length) return null;

    const totalEarnings = dailyStats.reduce((sum, day) => sum + day.total_pay, 0);
    const totalOrders = dailyStats.reduce((sum, day) => sum + day.total_orders, 0);
    const totalMiles = dailyStats.reduce((sum, day) => sum + day.total_miles, 0);
    const totalHours = dailyStats.reduce((sum, day) => sum + (day.total_minutes / 60), 0);

    return {
      totalEarnings,
      totalOrders,
      totalMiles,
      totalHours,
      avgPayPerHour: totalHours > 0 ? totalEarnings / totalHours : 0,
      avgPayPerMile: totalMiles > 0 ? totalEarnings / totalMiles : 0,
      avgOrdersPerDay: totalOrders / dailyStats.length,
      avgEarningsPerDay: totalEarnings / dailyStats.length
    };
  };

  const timeRangeStats = getTimeRangeStats();

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
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Time Range Selector */}
      <motion.div className="dashboard-header" variants={itemVariants}>
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${timeRange === '7days' ? 'active' : ''}`}
            onClick={() => setTimeRange('7days')}
          >
            Last 7 Days
          </button>
          <button
            className={`time-range-btn ${timeRange === '30days' ? 'active' : ''}`}
            onClick={() => setTimeRange('30days')}
          >
            Last 30 Days
          </button>
          <button
            className={`time-range-btn ${timeRange === '90days' ? 'active' : ''}`}
            onClick={() => setTimeRange('90days')}
          >
            Last 90 Days
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div className="stats-grid" variants={itemVariants}>
        <StatsCard
          title="Total Earnings"
          value={timeRangeStats ? `$${timeRangeStats.totalEarnings.toFixed(2)}` : '$0.00'}
          icon={DollarSign}
          color="green"
          trend={dailyStats.length > 1 ? {
            value: ((dailyStats[0]?.total_pay || 0) - (dailyStats[dailyStats.length - 1]?.total_pay || 0)),
            isPositive: (dailyStats[0]?.total_pay || 0) >= (dailyStats[dailyStats.length - 1]?.total_pay || 0)
          } : null}
        />
        <StatsCard
          title="Pay Per Hour"
          value={timeRangeStats ? `$${timeRangeStats.avgPayPerHour.toFixed(2)}` : '$0.00'}
          icon={Clock}
          color="blue"
          trend={dailyStats.length > 1 ? {
            value: ((dailyStats[0]?.pay_per_hour || 0) - (dailyStats[dailyStats.length - 1]?.pay_per_hour || 0)),
            isPositive: (dailyStats[0]?.pay_per_hour || 0) >= (dailyStats[dailyStats.length - 1]?.pay_per_hour || 0)
          } : null}
        />
        <StatsCard
          title="Pay Per Mile"
          value={timeRangeStats ? `$${timeRangeStats.avgPayPerMile.toFixed(2)}` : '$0.00'}
          icon={MapPin}
          color="purple"
          trend={dailyStats.length > 1 ? {
            value: ((dailyStats[0]?.pay_per_mile || 0) - (dailyStats[dailyStats.length - 1]?.pay_per_mile || 0)),
            isPositive: (dailyStats[0]?.pay_per_mile || 0) >= (dailyStats[dailyStats.length - 1]?.pay_per_mile || 0)
          } : null}
        />
        <StatsCard
          title="Total Orders"
          value={timeRangeStats ? timeRangeStats.totalOrders.toString() : '0'}
          icon={Target}
          color="orange"
          trend={dailyStats.length > 1 ? {
            value: ((dailyStats[0]?.total_orders || 0) - (dailyStats[dailyStats.length - 1]?.total_orders || 0)),
            isPositive: (dailyStats[0]?.total_orders || 0) >= (dailyStats[dailyStats.length - 1]?.total_orders || 0)
          } : null}
        />
      </motion.div>

      {/* Charts and Analytics */}
      <div className="dashboard-content">
        <div className="dashboard-left">
          <motion.div variants={itemVariants}>
            <EarningsChart data={dailyStats} timeRange={timeRange} />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <PerformanceMetrics 
              overviewStats={overviewStats}
              timeRangeStats={timeRangeStats}
              dailyStats={dailyStats}
            />
          </motion.div>
        </div>

        <div className="dashboard-right">
          <motion.div variants={itemVariants}>
            <RecentOrders orders={recentOrders} />
          </motion.div>

          {/* Quick Stats */}
          <motion.div className="quick-stats card" variants={itemVariants}>
            <div className="card-header">
              <h3>Quick Stats</h3>
            </div>
            <div className="card-body">
              <div className="quick-stat-item">
                <div className="quick-stat-icon">
                  <Activity size={20} />
                </div>
                <div className="quick-stat-content">
                  <span className="quick-stat-label">Avg Orders/Day</span>
                  <span className="quick-stat-value">
                    {timeRangeStats ? timeRangeStats.avgOrdersPerDay.toFixed(1) : '0'}
                  </span>
                </div>
              </div>
              
              <div className="quick-stat-item">
                <div className="quick-stat-icon">
                  <Calendar size={20} />
                </div>
                <div className="quick-stat-content">
                  <span className="quick-stat-label">Avg Earnings/Day</span>
                  <span className="quick-stat-value">
                    ${timeRangeStats ? timeRangeStats.avgEarningsPerDay.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
              
              <div className="quick-stat-item">
                <div className="quick-stat-icon">
                  <Award size={20} />
                </div>
                <div className="quick-stat-content">
                  <span className="quick-stat-label">Total Hours</span>
                  <span className="quick-stat-value">
                    {timeRangeStats ? timeRangeStats.totalHours.toFixed(1) : '0'}h
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;