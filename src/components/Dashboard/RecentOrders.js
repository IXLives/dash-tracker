import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Clock, MapPin, DollarSign, Calendar } from 'lucide-react';
import './RecentOrders.css';

const RecentOrders = ({ orders = [] }) => {
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
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  const formatTime = (time) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch {
      return time;
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const calculatePayPerHour = (pay, durationMinutes) => {
    if (durationMinutes <= 0) return 0;
    return (pay / (durationMinutes / 60)).toFixed(2);
  };

  const calculatePayPerMile = (pay, miles) => {
    if (miles <= 0) return 0;
    return (pay / miles).toFixed(2);
  };

  if (orders.length === 0) {
    return (
      <div className="recent-orders card">
        <div className="card-header">
          <h3>Recent Orders</h3>
        </div>
        <div className="card-body">
          <div className="empty-state">
            <Calendar size={48} />
            <h4>No orders yet</h4>
            <p>Start tracking your DoorDash deliveries to see them here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-orders card">
      <div className="card-header">
        <h3>Recent Orders</h3>
        <span className="order-count">{orders.length} orders</span>
      </div>
      <div className="card-body">
        <motion.div
          className="orders-list"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {orders.orders.map((order) => (
            <motion.div
              key={order.id}
              className="order-item"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="order-header">
                <div className="order-date">
                  <Calendar size={16} />
                  <span>{formatDate(order.date)}</span>
                </div>
                <div className="order-pay">
                  <DollarSign size={16} />
                  <span className="pay-amount">${order.pay.toFixed(2)}</span>
                </div>
              </div>

              <div className="order-details">
                <div className="order-time">
                  <Clock size={14} />
                  <span>
                    {formatTime(order.start_time)} - {formatTime(order.end_time)}
                  </span>
                  <span className="duration">
                    ({order.duration_minutes}m)
                  </span>
                </div>

                <div className="order-distance">
                  <MapPin size={14} />
                  <span>{order.miles.toFixed(1)} miles</span>
                </div>
              </div>

              <div className="order-metrics">
                <div className="metric">
                  <span className="metric-label">$/hr</span>
                  <span className="metric-value">
                    ${calculatePayPerHour(order.pay, order.duration_minutes)}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">$/mi</span>
                  <span className="metric-value">
                    ${calculatePayPerMile(order.pay, order.miles)}
                  </span>
                </div>
              </div>

              {order.notes && (
                <div className="order-notes">
                  <p>{order.notes}</p>
                </div>
              )}

              <div className="order-breakdown">
                {order.base_pay > 0 && (
                  <div className="breakdown-item">
                    <span>Base Pay</span>
                    <span>${order.base_pay.toFixed(2)}</span>
                  </div>
                )}
                {order.tip > 0 && (
                  <div className="breakdown-item">
                    <span>Tip</span>
                    <span>${order.tip.toFixed(2)}</span>
                  </div>
                )}
                {order.peak_pay > 0 && (
                  <div className="breakdown-item">
                    <span>Peak Pay</span>
                    <span>${order.peak_pay.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default RecentOrders;