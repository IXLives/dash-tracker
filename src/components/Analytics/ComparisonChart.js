import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { PieChart as PieChartIcon, BarChart3, Calendar, Award } from 'lucide-react';
import { format, parseISO, getDay } from 'date-fns';
import './ComparisonChart.css';

const ComparisonChart = ({ data = [], performance = null }) => {
  const [chartType, setChartType] = useState('dayOfWeek');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const colors = ['#eb1700', '#ff6600', '#ffcc00', '#00b894', '#0984e3', '#a29bfe', '#fd79a8'];

  const generateDayOfWeekData = () => {
    const dayData = Array(7).fill(0).map((_, index) => ({
      day: dayNames[index],
      dayIndex: index,
      earnings: 0,
      orders: 0,
      hours: 0,
      avgPayPerHour: 0
    }));

    data.forEach(dayRecord => {
      try {
        const dayIndex = getDay(parseISO(dayRecord.date));
        dayData[dayIndex].earnings += dayRecord.total_pay;
        dayData[dayIndex].orders += dayRecord.total_orders;
        dayData[dayIndex].hours += dayRecord.total_minutes / 60;
      } catch (error) {
        console.error('Error parsing date:', dayRecord.date);
      }
    });

    return dayData.map(day => ({
      ...day,
      avgPayPerHour: day.hours > 0 ? day.earnings / day.hours : 0
    }));
  };

  const generatePayBreakdownData = () => {
    if (!performance || !performance.totals) return [];

    const { totals } = performance;
    const breakdown = [];

    // Calculate estimated breakdown based on typical DoorDash structure
    const totalEarnings = totals.earnings || 0;
    
    if (totalEarnings > 0) {
      // Rough estimates - in reality this would come from order data
      const estimatedBasePay = totalEarnings * 0.3; // ~30% base pay
      const estimatedTips = totalEarnings * 0.6; // ~60% tips
      const estimatedPeakPay = totalEarnings * 0.1; // ~10% peak pay

      breakdown.push(
        { name: 'Tips', value: estimatedTips, color: '#00b894' },
        { name: 'Base Pay', value: estimatedBasePay, color: '#0984e3' },
        { name: 'Peak Pay', value: estimatedPeakPay, color: '#ff6600' }
      );
    }

    return breakdown;
  };

  const generatePerformanceComparisonData = () => {
    if (!performance) return [];

    const { bestDay, worstDay, averages } = performance;
    
    if (!bestDay || !worstDay) return [];

    return [
      {
        category: 'Best Day',
        payPerHour: bestDay.pay_per_hour || 0,
        payPerMile: bestDay.pay_per_mile || 0,
        orders: bestDay.total_orders || 0,
        earnings: bestDay.total_pay || 0
      },
      {
        category: 'Average',
        payPerHour: averages?.payPerHour || 0,
        payPerMile: averages?.payPerMile || 0,
        orders: averages?.ordersPerDay || 0,
        earnings: averages?.avgEarningsPerDay || 0
      },
      {
        category: 'Worst Day',
        payPerHour: worstDay.pay_per_hour || 0,
        payPerMile: worstDay.pay_per_mile || 0,
        orders: worstDay.total_orders || 0,
        earnings: worstDay.total_pay || 0
      }
    ];
  };

  const chartOptions = [
    { id: 'dayOfWeek', label: 'Day of Week', icon: Calendar },
    { id: 'payBreakdown', label: 'Pay Breakdown', icon: PieChartIcon },
    { id: 'performance', label: 'Performance', icon: Award }
  ];

  const dayOfWeekData = generateDayOfWeekData();
  const payBreakdownData = generatePayBreakdownData();
  const performanceData = generatePerformanceComparisonData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="comparison-tooltip">
          <p className="tooltip-label">{label}</p>
          <div className="tooltip-content">
            {payload.map((entry, index) => (
              <p key={index} className="tooltip-value" style={{ color: entry.color }}>
                <span className="tooltip-metric">{entry.name}:</span>
                <span>
                  {entry.name.includes('Pay') || entry.name.includes('earnings') 
                    ? `$${entry.value.toFixed(2)}` 
                    : entry.value.toFixed(1)
                  }
                </span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="comparison-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <div className="tooltip-content">
            <p className="tooltip-value">
              <span className="tooltip-metric">Amount:</span>
              <span>${data.value.toFixed(2)}</span>
            </p>
            <p className="tooltip-value">
              <span className="tooltip-metric">Percentage:</span>
              <span>{((data.value / payBreakdownData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'dayOfWeek':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dayOfWeekData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis 
                dataKey="day" 
                stroke="var(--text-tertiary)"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="var(--text-tertiary)"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="earnings" fill="#eb1700" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'payBreakdown':
        if (payBreakdownData.length === 0) {
          return (
            <div className="chart-empty">
              <PieChartIcon size={48} />
              <p>No pay breakdown data available</p>
            </div>
          );
        }
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={payBreakdownData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {payBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'performance':
        if (performanceData.length === 0) {
          return (
            <div className="chart-empty">
              <Award size={48} />
              <p>No performance comparison data available</p>
            </div>
          );
        }
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis 
                dataKey="category" 
                stroke="var(--text-tertiary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--text-tertiary)"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="payPerHour" fill="#eb1700" name="Pay/Hour" />
              <Bar dataKey="payPerMile" fill="#0984e3" name="Pay/Mile" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getChartSummary = () => {
    switch (chartType) {
      case 'dayOfWeek':
        const bestDay = dayOfWeekData.reduce((best, day) => 
          day.earnings > best.earnings ? day : best
        );
        const totalDayEarnings = dayOfWeekData.reduce((sum, day) => sum + day.earnings, 0);
        return {
          title: 'Day of Week Analysis',
          stats: [
            { label: 'Best Day', value: bestDay.day },
            { label: 'Best Day Earnings', value: `$${bestDay.earnings.toFixed(2)}` },
            { label: 'Total Earnings', value: `$${totalDayEarnings.toFixed(2)}` }
          ]
        };

      case 'payBreakdown':
        const totalBreakdown = payBreakdownData.reduce((sum, item) => sum + item.value, 0);
        const largestComponent = payBreakdownData.reduce((largest, item) => 
          item.value > largest.value ? item : largest, { value: 0, name: 'N/A' }
        );
        return {
          title: 'Pay Breakdown',
          stats: [
            { label: 'Total Earnings', value: `$${totalBreakdown.toFixed(2)}` },
            { label: 'Largest Component', value: largestComponent.name },
            { label: 'Component Value', value: `$${largestComponent.value.toFixed(2)}` }
          ]
        };

      case 'performance':
        const bestPerformance = performanceData.find(p => p.category === 'Best Day');
        const avgPerformance = performanceData.find(p => p.category === 'Average');
        return {
          title: 'Performance Comparison',
          stats: [
            { label: 'Best Pay/Hour', value: `$${bestPerformance?.payPerHour.toFixed(2) || '0.00'}` },
            { label: 'Avg Pay/Hour', value: `$${avgPerformance?.payPerHour.toFixed(2) || '0.00'}` },
            { label: 'Performance Gap', value: `${((bestPerformance?.payPerHour || 0) - (avgPerformance?.payPerHour || 0)).toFixed(2)}` }
          ]
        };

      default:
        return { title: 'Comparison Chart', stats: [] };
    }
  };

  const summary = getChartSummary();

  if (data.length === 0) {
    return (
      <div className="comparison-chart card">
        <div className="card-header">
          <h3>Comparison Chart</h3>
        </div>
        <div className="card-body">
          <div className="comparison-empty-state">
            <BarChart3 size={48} />
            <h4>No comparison data available</h4>
            <p>Add more orders to see comparison charts and insights.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="comparison-chart card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-header">
        <h3>{summary.title}</h3>
        <div className="chart-type-selector">
          {chartOptions.map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                className={`chart-type-btn ${chartType === option.id ? 'active' : ''}`}
                onClick={() => setChartType(option.id)}
                title={option.label}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="card-body">
        <div className="chart-container">
          {renderChart()}
        </div>

        <div className="chart-summary">
          <div className="summary-stats">
            {summary.stats.map((stat, index) => (
              <div key={index} className="summary-stat">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ComparisonChart;