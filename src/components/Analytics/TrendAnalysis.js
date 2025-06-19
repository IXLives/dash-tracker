import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { format } from 'date-fns';
import './TrendAnalysis.css';

const TrendAnalysis = ({ data = null, metric = 'pay_per_hour', dateRange = '30days' }) => {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="trend-analysis card">
        <div className="card-header">
          <h3>Trend Analysis</h3>
        </div>
        <div className="card-body">
          <div className="trend-empty-state">
            <TrendingUp size={48} />
            <h4>No trend data available</h4>
            <p>Add more orders to see trend analysis for your selected metric.</p>
          </div>
        </div>
      </div>
    );
  }

  const { data: trendData, summary, metric: currentMetric } = data;

  const formatXAxisLabel = (dateString) => {
    try {
      const date = new Date(dateString);
      if (dateRange === '7days') {
        return format(date, 'EEE');
      } else if (dateRange === '30days') {
        return format(date, 'MMM d');
      } else {
        return format(date, 'MMM d');
      }
    } catch {
      return dateString;
    }
  };

  const formatTooltipLabel = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
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
        <div className="trend-tooltip">
          <p className="tooltip-label">{formatTooltipLabel(label)}</p>
          <div className="tooltip-content">
            <p className="tooltip-value">
              <span className="tooltip-metric">Value:</span>
              <span>{formatTooltipValue(payload[0].value, currentMetric)[0]}</span>
            </p>
            <p className="tooltip-value">
              <span className="tooltip-metric">7-Day Avg:</span>
              <span>{formatTooltipValue(data.movingAverage, currentMetric)[0]}</span>
            </p>
            <p className="tooltip-value">
              <span className="tooltip-metric">Orders:</span>
              <span>{data.totalOrders}</span>
            </p>
            <p className="tooltip-value">
              <span className="tooltip-metric">Earnings:</span>
              <span>${data.totalPay.toFixed(2)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = () => {
    if (summary.trend > 5) return TrendingUp;
    if (summary.trend < -5) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (summary.trend > 5) return 'var(--success)';
    if (summary.trend < -5) return 'var(--error)';
    return 'var(--text-secondary)';
  };

  const getTrendText = () => {
    if (summary.trend > 5) return 'Improving';
    if (summary.trend < -5) return 'Declining';
    return 'Stable';
  };

  const TrendIcon = getTrendIcon();
  const trendColor = getTrendColor();

  const metricLabels = {
    pay_per_hour: 'Pay per Hour',
    pay_per_mile: 'Pay per Mile',
    total_pay: 'Total Earnings',
    total_orders: 'Total Orders',
    avg_pay_per_order: 'Avg Pay per Order'
  };

  return (
    <motion.div
      className="trend-analysis card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <div className="header-content">
          <h3>Trend Analysis</h3>
          <span className="metric-label">{metricLabels[currentMetric] || currentMetric}</span>
        </div>
        <div className="trend-indicator" style={{ color: trendColor }}>
          <TrendIcon size={20} />
          <span className="trend-text">{getTrendText()}</span>
        </div>
      </div>

      <div className="card-body">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={trendData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis 
                dataKey="date"
                tickFormatter={formatXAxisLabel}
                stroke="var(--text-tertiary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--text-tertiary)"
                fontSize={12}
                tickFormatter={(value) => 
                  currentMetric.includes('pay') || currentMetric.includes('earnings') 
                    ? `$${value}` 
                    : value
                }
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Average reference line */}
              <ReferenceLine 
                y={summary.average} 
                stroke="var(--dd-blue)" 
                strokeDasharray="5 5"
                label={{ value: "Average", position: "topRight" }}
              />
              
              {/* Actual values line */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--dd-red)"
                strokeWidth={2}
                dot={{ fill: 'var(--dd-red)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--dd-red)', strokeWidth: 2 }}
                name="Actual"
              />
              
              {/* Moving average line */}
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="var(--dd-blue)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="7-Day Average"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="trend-summary">
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-icon">
                <Target size={16} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Average</span>
                <span className="summary-value">
                  {currentMetric.includes('pay') || currentMetric.includes('earnings') 
                    ? `$${summary.average.toFixed(2)}` 
                    : summary.average.toFixed(2)
                  }
                </span>
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-icon">
                <TrendingUp size={16} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Highest</span>
                <span className="summary-value">
                  {currentMetric.includes('pay') || currentMetric.includes('earnings') 
                    ? `$${summary.highest.toFixed(2)}` 
                    : summary.highest.toFixed(2)
                  }
                </span>
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-icon">
                <TrendingDown size={16} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Lowest</span>
                <span className="summary-value">
                  {currentMetric.includes('pay') || currentMetric.includes('earnings') 
                    ? `$${summary.lowest.toFixed(2)}` 
                    : summary.lowest.toFixed(2)
                  }
                </span>
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-icon" style={{ color: trendColor }}>
                <TrendIcon size={16} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Trend</span>
                <span className="summary-value" style={{ color: trendColor }}>
                  {summary.trend > 0 ? '+' : ''}{summary.trend.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="trend-insights">
          <h4>Insights</h4>
          <div className="insights-list">
            {summary.trend > 10 && (
              <div className="insight-item positive">
                <TrendingUp size={16} />
                <span>Strong upward trend! Your {metricLabels[currentMetric].toLowerCase()} is improving significantly.</span>
              </div>
            )}
            
            {summary.trend < -10 && (
              <div className="insight-item negative">
                <TrendingDown size={16} />
                <span>Declining trend detected. Consider analyzing what changed in your delivery strategy.</span>
              </div>
            )}
            
            {Math.abs(summary.trend) <= 5 && (
              <div className="insight-item neutral">
                <Minus size={16} />
                <span>Performance is stable. Consistency is key to long-term success.</span>
              </div>
            )}
            
            {summary.highest / summary.average > 1.5 && (
              <div className="insight-item info">
                <Target size={16} />
                <span>You have high-performing days! Try to identify patterns in your best performances.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrendAnalysis;