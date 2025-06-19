import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import './HourlyAnalysis.css';

const HourlyAnalysis = ({ data = [], date = null }) => {
  // Generate color based on performance
  const getBarColor = (value, maxValue) => {
    const intensity = maxValue > 0 ? value / maxValue : 0;
    if (intensity > 0.8) return '#00b894'; // High performance - green
    if (intensity > 0.6) return '#0984e3'; // Good performance - blue
    if (intensity > 0.4) return '#ff6600'; // Average performance - orange
    if (intensity > 0.2) return '#fdcb6e'; // Low performance - yellow
    return '#ddd'; // No data - gray
  };

  const formatHour = (hour) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return format(date, 'ha');
  };

  const formatTooltipValue = (value, name) => {
    if (name.includes('pay') || name.includes('earnings')) {
      return [`$${parseFloat(value).toFixed(2)}`, name];
    }
    if (name.includes('orders')) {
      return [Math.round(value), name];
    }
    return [parseFloat(value).toFixed(2), name];
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="hourly-tooltip">
          <p className="tooltip-label">{formatHour(label)}</p>
          <div className="tooltip-content">
            <p className="tooltip-value">
              <span className="tooltip-metric">Orders:</span>
              <span>{data.total_orders}</span>
            </p>
            <p className="tooltip-value">
              <span className="tooltip-metric">Earnings:</span>
              <span>${data.total_pay.toFixed(2)}</span>
            </p>
            <p className="tooltip-value">
              <span className="tooltip-metric">Pay/Hour:</span>
              <span>${data.pay_per_hour.toFixed(2)}</span>
            </p>
            <p className="tooltip-value">
              <span className="tooltip-metric">Hours Worked:</span>
              <span>{data.total_hours.toFixed(1)}h</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Find peak hours
  const peakHours = data
    .filter(hour => hour.total_orders > 0)
    .sort((a, b) => b.total_pay - a.total_pay)
    .slice(0, 3);

  const maxPayPerHour = Math.max(...data.map(hour => hour.pay_per_hour));
  const totalOrders = data.reduce((sum, hour) => sum + hour.total_orders, 0);
  const totalEarnings = data.reduce((sum, hour) => sum + hour.total_pay, 0);
  const activeHours = data.filter(hour => hour.total_orders > 0).length;

  if (data.length === 0 || totalOrders === 0) {
    return (
      <div className="hourly-analysis card">
        <div className="card-header">
          <h3>Hourly Analysis</h3>
        </div>
        <div className="card-body">
          <div className="hourly-empty-state">
            <Clock size={48} />
            <h4>No hourly data available</h4>
            <p>Complete some orders to see your hourly performance breakdown.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="hourly-analysis card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <div className="header-content">
          <h3>Hourly Analysis</h3>
          {date && (
            <span className="analysis-date">
              {format(new Date(date), 'EEEE, MMM d, yyyy')}
            </span>
          )}
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <span className="stat-value">{activeHours}</span>
            <span className="stat-label">Active Hours</span>
          </div>
          <div className="header-stat">
            <span className="stat-value">${totalEarnings.toFixed(2)}</span>
            <span className="stat-label">Total Earned</span>
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis 
                dataKey="hour"
                tickFormatter={formatHour}
                stroke="var(--text-tertiary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--text-tertiary)"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pay_per_hour" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.pay_per_hour, maxPayPerHour)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {peakHours.length > 0 && (
          <div className="peak-hours-section">
            <h4>Peak Performance Hours</h4>
            <div className="peak-hours-grid">
              {peakHours.map((hour, index) => (
                <motion.div
                  key={hour.hour}
                  className="peak-hour-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <div className="peak-hour-rank">#{index + 1}</div>
                  <div className="peak-hour-time">
                    {formatHour(hour.hour)}
                  </div>
                  <div className="peak-hour-stats">
                    <div className="peak-stat">
                      <span className="peak-stat-value">${hour.total_pay.toFixed(2)}</span>
                      <span className="peak-stat-label">Earned</span>
                    </div>
                    <div className="peak-stat">
                      <span className="peak-stat-value">{hour.total_orders}</span>
                      <span className="peak-stat-label">Orders</span>
                    </div>
                    <div className="peak-stat">
                      <span className="peak-stat-value">${hour.pay_per_hour.toFixed(2)}</span>
                      <span className="peak-stat-label">Per Hour</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="hourly-insights">
          <h4>Insights</h4>
          <div className="insights-grid">
            <div className="insight-item">
              <TrendingUp size={16} />
              <div className="insight-content">
                <span className="insight-title">Best Hour</span>
                <span className="insight-value">
                  {peakHours.length > 0 ? formatHour(peakHours[0].hour) : 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="insight-item">
              <Clock size={16} />
              <div className="insight-content">
                <span className="insight-title">Avg Per Active Hour</span>
                <span className="insight-value">
                  ${activeHours > 0 ? (totalEarnings / activeHours).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
            
            <div className="insight-item">
              <TrendingUp size={16} />
              <div className="insight-content">
                <span className="insight-title">Peak Pay Rate</span>
                <span className="insight-value">
                  ${maxPayPerHour.toFixed(2)}/hr
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HourlyAnalysis;