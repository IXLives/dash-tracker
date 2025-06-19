import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Award,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';
import './PerformanceMetrics.css';

const PerformanceMetrics = ({ 
  overviewStats = null, 
  timeRangeStats = null, 
  dailyStats = [] 
}) => {
  const calculateEfficiencyScore = (payPerHour, payPerMile) => {
    if (!payPerHour || !payPerMile) return 0;
    // Weighted score: 60% pay per hour, 40% pay per mile
    const normalizedHourly = Math.min(payPerHour / 25, 1); // Normalize to $25/hour max
    const normalizedMile = Math.min(payPerMile / 3, 1); // Normalize to $3/mile max
    return Math.round((normalizedHourly * 0.6 + normalizedMile * 0.4) * 100);
  };

  const getPerformanceLevel = (score) => {
    if (score >= 80) return { level: 'Excellent', color: 'var(--success)', icon: Award };
    if (score >= 60) return { level: 'Good', color: 'var(--dd-blue)', icon: TrendingUp };
    if (score >= 40) return { level: 'Average', color: 'var(--dd-yellow)', icon: Target };
    return { level: 'Needs Improvement', color: 'var(--error)', icon: Activity };
  };

  const getBestPerformingDay = () => {
    if (!dailyStats.length) return null;
    return dailyStats.reduce((best, day) => 
      day.pay_per_hour > (best?.pay_per_hour || 0) ? day : best
    );
  };

  const getConsistencyScore = () => {
    if (dailyStats.length < 3) return null;
    
    const payPerHourValues = dailyStats.map(day => day.pay_per_hour || 0);
    const mean = payPerHourValues.reduce((sum, val) => sum + val, 0) / payPerHourValues.length;
    const variance = payPerHourValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / payPerHourValues.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    const consistencyScore = Math.max(0, 100 - (standardDeviation / mean) * 100);
    return Math.round(consistencyScore);
  };

  const efficiencyScore = timeRangeStats ? 
    calculateEfficiencyScore(timeRangeStats.avgPayPerHour, timeRangeStats.avgPayPerMile) : 0;
  
  const performance = getPerformanceLevel(efficiencyScore);
  const PerformanceIcon = performance.icon;
  const bestDay = getBestPerformingDay();
  const consistencyScore = getConsistencyScore();

  const metrics = [
    {
      id: 'efficiency',
      title: 'Efficiency Score',
      value: `${efficiencyScore}%`,
      icon: Target,
      color: performance.color,
      description: performance.level,
      trend: efficiencyScore >= 60 ? 'positive' : 'negative'
    },
    {
      id: 'consistency',
      title: 'Consistency',
      value: consistencyScore ? `${consistencyScore}%` : 'N/A',
      icon: Activity,
      color: consistencyScore >= 70 ? 'var(--success)' : consistencyScore >= 50 ? 'var(--dd-yellow)' : 'var(--error)',
      description: consistencyScore >= 70 ? 'Very Consistent' : consistencyScore >= 50 ? 'Moderately Consistent' : 'Inconsistent',
      trend: consistencyScore >= 60 ? 'positive' : 'negative'
    },
    {
      id: 'total_earnings',
      title: 'Total Earnings',
      value: overviewStats ? `$${overviewStats.total_earnings?.toFixed(2) || '0.00'}` : '$0.00',
      icon: DollarSign,
      color: 'var(--success)',
      description: 'All time earnings',
      trend: 'positive'
    },
    {
      id: 'avg_hourly',
      title: 'Avg Hourly Rate',
      value: overviewStats ? `$${overviewStats.avg_pay_per_hour?.toFixed(2) || '0.00'}` : '$0.00',
      icon: Clock,
      color: 'var(--dd-blue)',
      description: 'Overall average',
      trend: 'neutral'
    }
  ];

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

  return (
    <motion.div
      className="performance-metrics card"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="card-header">
        <h3>Performance Metrics</h3>
        <div className="performance-badge" style={{ color: performance.color }}>
          <PerformanceIcon size={16} />
          <span>{performance.level}</span>
        </div>
      </div>

      <div className="card-body">
        <div className="metrics-grid">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.id}
                className="metric-card"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
              >
                <div className="metric-header">
                  <div className="metric-icon" style={{ color: metric.color }}>
                    <Icon size={20} />
                  </div>
                  <div className="metric-trend">
                    {metric.trend === 'positive' && <TrendingUp size={14} className="trend-positive" />}
                    {metric.trend === 'negative' && <TrendingUp size={14} className="trend-negative" />}
                  </div>
                </div>
                <div className="metric-content">
                  <h4 className="metric-title">{metric.title}</h4>
                  <div className="metric-value" style={{ color: metric.color }}>
                    {metric.value}
                  </div>
                  <p className="metric-description">{metric.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {bestDay && (
          <motion.div className="best-day-section" variants={itemVariants}>
            <h4>Best Performing Day</h4>
            <div className="best-day-card">
              <div className="best-day-header">
                <Calendar size={16} />
                <span className="best-day-date">{bestDay.date}</span>
                <div className="best-day-badge">
                  <Award size={14} />
                  <span>Best Day</span>
                </div>
              </div>
              <div className="best-day-stats">
                <div className="best-day-stat">
                  <DollarSign size={14} />
                  <span>${bestDay.total_pay.toFixed(2)} earned</span>
                </div>
                <div className="best-day-stat">
                  <Clock size={14} />
                  <span>${bestDay.pay_per_hour.toFixed(2)}/hour</span>
                </div>
                <div className="best-day-stat">
                  <MapPin size={14} />
                  <span>${bestDay.pay_per_mile.toFixed(2)}/mile</span>
                </div>
                <div className="best-day-stat">
                  <Target size={14} />
                  <span>{bestDay.total_orders} orders</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div className="performance-tips" variants={itemVariants}>
          <h4>Performance Tips</h4>
          <div className="tips-list">
            {efficiencyScore < 60 && (
              <div className="tip-item">
                <div className="tip-icon">💡</div>
                <p>Focus on higher-paying orders to improve your efficiency score.</p>
              </div>
            )}
            {consistencyScore && consistencyScore < 50 && (
              <div className="tip-item">
                <div className="tip-icon">📈</div>
                <p>Try to maintain consistent working hours for better earnings stability.</p>
              </div>
            )}
            {timeRangeStats && timeRangeStats.avgPayPerMile < 1.5 && (
              <div className="tip-item">
                <div className="tip-icon">🎯</div>
                <p>Consider declining orders with low pay-per-mile ratios.</p>
              </div>
            )}
            {(!timeRangeStats || timeRangeStats.totalOrders < 10) && (
              <div className="tip-item">
                <div className="tip-icon">🚀</div>
                <p>Complete more orders to get better performance insights.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PerformanceMetrics;