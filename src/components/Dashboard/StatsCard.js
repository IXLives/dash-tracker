import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatsCard.css';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  trend = null,
  subtitle = null,
  loading = false 
}) => {
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    hover: {
      y: -4,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        delay: 0.2,
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  const valueVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1,
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  if (loading) {
    return (
      <div className={`stats-card stats-card-${color} loading`}>
        <div className="stats-card-content">
          <div className="stats-card-header">
            <div className="stats-card-title-skeleton"></div>
            <div className="stats-card-icon-skeleton"></div>
          </div>
          <div className="stats-card-value-skeleton"></div>
          <div className="stats-card-trend-skeleton"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`stats-card stats-card-${color}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <div className="stats-card-content">
        <div className="stats-card-header">
          <div className="stats-card-title-section">
            <h3 className="stats-card-title">{title}</h3>
            {subtitle && <p className="stats-card-subtitle">{subtitle}</p>}
          </div>
          <motion.div
            className="stats-card-icon"
            variants={iconVariants}
          >
            <Icon size={24} />
          </motion.div>
        </div>

        <motion.div
          className="stats-card-value"
          variants={valueVariants}
        >
          {value}
        </motion.div>

        {trend && (
          <motion.div
            className={`stats-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="trend-icon">
              {trend.isPositive ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
            </div>
            <span className="trend-value">
              {trend.isPositive ? '+' : ''}
              {typeof trend.value === 'number' ? trend.value.toFixed(2) : trend.value}
              {trend.percentage && '%'}
            </span>
            <span className="trend-label">vs last period</span>
          </motion.div>
        )}
      </div>

      {/* Animated background gradient */}
      <div className="stats-card-gradient"></div>
    </motion.div>
  );
};

export default StatsCard;