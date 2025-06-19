import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Clock,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import OrderForm from '../components/OrderForm/OrderForm';
import BulkOrderForm from '../components/OrderForm/BulkOrderForm';
import { useApi, usePaginatedApi } from '../hooks/useApi';
import './Orders.css';

const Orders = () => {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const api = useApi();
  const {
    data: orders,
    loading,
    error,
    loadData,
    loadMore,
    refresh,
    pagination
  } = usePaginatedApi('/orders');

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrder = async (orderData) => {
    try {
      await api.post('/orders', orderData);
      toast.success('Order created successfully!');
      setShowOrderForm(false);
      refresh();
    } catch (error) {
      toast.error(error.message || 'Failed to create order');
    }
  };

  const handleBulkCreate = async (ordersData) => {
    try {
      const result = await api.post('/orders/bulk', ordersData);
      toast.success(`Successfully created ${result.orders.length} orders!`);
      setShowBulkForm(false);
      refresh();
    } catch (error) {
      toast.error(error.message || 'Failed to create orders');
    }
  };

  const handleUpdateOrder = async (orderData) => {
    try {
      await api.put(`/orders/${editingOrder.id}`, orderData);
      toast.success('Order updated successfully!');
      setEditingOrder(null);
      refresh();
    } catch (error) {
      toast.error(error.message || 'Failed to update order');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Order deleted successfully!');
      refresh();
    } catch (error) {
      toast.error(error.message || 'Failed to delete order');
    }
  };

  const handleExportOrders = () => {
    const csvContent = [
      ['Date', 'Start Time', 'End Time', 'Duration (min)', 'Pay', 'Miles', 'Tip', 'Base Pay', 'Peak Pay', 'Notes'],
      ...orders.map(order => [
        order.date,
        order.start_time,
        order.end_time,
        order.duration_minutes,
        order.pay,
        order.miles,
        order.tip || 0,
        order.base_pay || 0,
        order.peak_pay || 0,
        order.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doordash-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.date.includes(searchTerm);
    
    const matchesDate = !filterDate || order.date === filterDate;
    
    return matchesSearch && matchesDate;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(`${a.date} ${a.start_time}`);
        bValue = new Date(`${b.date} ${b.start_time}`);
        break;
      case 'pay':
        aValue = a.pay;
        bValue = b.pay;
        break;
      case 'duration':
        aValue = a.duration_minutes;
        bValue = b.duration_minutes;
        break;
      case 'miles':
        aValue = a.miles;
        bValue = b.miles;
        break;
      default:
        aValue = a[sortBy];
        bValue = b[sortBy];
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

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

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="orders-header">
        <div className="orders-title">
          <h1>Orders</h1>
          <p>Manage your DoorDash delivery orders</p>
        </div>
        <div className="orders-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowBulkForm(true)}
          >
            <Upload size={16} />
            Bulk Import
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportOrders}
            disabled={orders.length === 0}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowOrderForm(true)}
          >
            <Plus size={16} />
            New Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <div className="filter-group">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="date-filter">
            <Calendar size={16} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="sort-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input"
          >
            <option value="date">Sort by Date</option>
            <option value="pay">Sort by Pay</option>
            <option value="duration">Sort by Duration</option>
            <option value="miles">Sort by Miles</option>
          </select>
          
          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-content">
        {loading && orders.length === 0 ? (
          <div className="orders-loading">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="orders-empty">
            <Calendar size={48} />
            <h3>No orders found</h3>
            <p>
              {orders.length === 0 
                ? "Start tracking your DoorDash deliveries by adding your first order."
                : "No orders match your current filters."
              }
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowOrderForm(true)}
            >
              <Plus size={16} />
              Add First Order
            </button>
          </div>
        ) : (
          <motion.div
            className="orders-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence>
              {sortedOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  className="order-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="order-card-header">
                    <div className="order-date">
                      <Calendar size={16} />
                      <span>{formatDate(order.date)}</span>
                    </div>
                    <div className="order-actions">
                      <button
                        className="action-btn edit"
                        onClick={() => setEditingOrder(order)}
                        title="Edit order"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteOrder(order.id)}
                        title="Delete order"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="order-card-body">
                    <div className="order-pay">
                      <DollarSign size={20} />
                      <span className="pay-amount">${order.pay.toFixed(2)}</span>
                    </div>

                    <div className="order-details">
                      <div className="detail-item">
                        <Clock size={14} />
                        <span>
                          {formatTime(order.start_time)} - {formatTime(order.end_time)}
                        </span>
                        <span className="duration">({order.duration_minutes}m)</span>
                      </div>
                      
                      <div className="detail-item">
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

                    {(order.base_pay > 0 || order.tip > 0 || order.peak_pay > 0) && (
                      <div className="order-breakdown">
                        {order.base_pay > 0 && (
                          <div className="breakdown-item">
                            <span>Base</span>
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
                            <span>Peak</span>
                            <span>${order.peak_pay.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {pagination.hasMore && (
          <div className="load-more-section">
            <button
              className="btn btn-secondary"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Order Form Modal */}
      <AnimatePresence>
        {showOrderForm && (
          <OrderForm
            onSubmit={handleCreateOrder}
            onClose={() => setShowOrderForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Bulk Order Form Modal */}
      <AnimatePresence>
        {showBulkForm && (
          <BulkOrderForm
            onSubmit={handleBulkCreate}
            onClose={() => setShowBulkForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Edit Order Form Modal */}
      <AnimatePresence>
        {editingOrder && (
          <OrderForm
            order={editingOrder}
            onSubmit={handleUpdateOrder}
            onClose={() => setEditingOrder(null)}
            isEditing={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;