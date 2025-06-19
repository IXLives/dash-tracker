import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import './EarningsChart.css';

const EarningsChart = ({ data = [], timeRange = '7days' }) => {
  const [chartType, setChartType] = useState('line');
  const [metric, setMetric] = useState('total_pay');

  const chartTypes = [
    { id: 'line', label: 'Line', icon: TrendingUp },
    { id: 'bar', label: 'Bar', icon: BarChart3 },
    { id: 'area', label: 'Area', icon: Activity }
  ];

  const metrics = [
    { id: 'total_pay', label: 'Total Earnings', color: '#eb1700' },
    { id: 'pay_per_hour', label: 'Pay per Hour', color: '#0984e3' },
    { id: 'pay_per_mile', label: 'Pay per Mile', color: '#00b894' },
    { id: 'total_orders', label: 'Total Orders', color: '#ff6600' }
  ];

  const formatXAxisLabel = (dateString) => {
    try {
      const date = new Date(dateString);
      if (timeRange === '7days') {
        return format(date, 'EEE');
      } else if (timeRange === '30days') {
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

  const currentMetric = metrics.find(m => m.id === metric);
  const chartData = data.map(item => ({
    ...item,
    date: item.date,
    displayDate: formatXAxisLabel(item.date)
  })).reverse(); // Reverse to show chronological order

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{formatTooltipLabel(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-value" style={{ color: entry.color }}>
              {`${entry.name}: ${formatTooltipValue(entry.value, entry.name)[0]}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis 
              dataKey="displayDate" 
              stroke="var(--text-tertiary)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--text-tertiary)"
              fontSize={12}
              tickFormatter={(value) => 
                metric.includes('pay') || metric.includes('earnings') 
                  ? `$${value}` 
                  : value
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={metric} 
              fill={currentMetric.color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis 
              dataKey="displayDate" 
              stroke="var(--text-tertiary)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--text-tertiary)"
              fontSize={12}
              tickFormatter={(value) => 
                metric.includes('pay') || metric.includes('earnings') 
                  ? `$${value}` 
                  : value
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={currentMetric.color}
              fillOpacity={1}
              fill="url(#colorGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        );
      
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis 
              dataKey="displayDate" 
              stroke="var(--text-tertiary)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--text-tertiary)"
              fontSize={12}
              tickFormatter={(value) => 
                metric.includes('pay') || metric.includes('earnings') 
                  ? `$${value}` 
                  : value
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={currentMetric.color}
              strokeWidth={3}
              dot={{ fill: currentMetric.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: currentMetric.color, strokeWidth: 2 }}
            />
          </LineChart>
        );
    }
  };

  if (!data.length) {
    return (
      <div className="earnings-chart card">
        <div className="card-header">
          <h3>Earnings Chart</h3>
        </div>
        <div className="card-body">
          <div className="chart-empty-state">
            <TrendingUp size={48} />
            <h4>No data available</h4>
            <p>Start adding orders to see your earnings trends.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="earnings-chart card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <h3>Earnings Chart</h3>
        <div className="chart-controls">
          <div className="metric-selector">
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="metric-select"
            >
              {metrics.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="chart-type-selector">
            {chartTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  className={`chart-type-btn ${chartType === type.id ? 'active' : ''}`}
                  onClick={() => setChartType(type.id)}
                  title={type.label}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        <div className="chart-summary">
          <div className="summary-item">
            <span className="summary-label">Current Metric</span>
            <span className="summary-value" style={{ color: currentMetric.color }}>
              {currentMetric.label}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Data Points</span>
            <span className="summary-value">{chartData.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Time Range</span>
            <span className="summary-value">
              {timeRange === '7days' ? 'Last 7 Days' : 
               timeRange === '30days' ? 'Last 30 Days' : 'Last 90 Days'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EarningsChart;