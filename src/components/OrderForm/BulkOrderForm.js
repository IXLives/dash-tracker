import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Download, Plus, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import './BulkOrderForm.css';

const BulkOrderForm = ({ onSubmit, onClose }) => {
  const [orders, setOrders] = useState([createEmptyOrder()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function createEmptyOrder() {
    return {
      date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '',
      end_time: '',
      duration_minutes: '',
      pay: '',
      miles: '',
      tip: '',
      base_pay: '',
      peak_pay: '',
      notes: ''
    };
  }

  const addOrder = () => {
    setOrders([...orders, createEmptyOrder()]);
  };

  const removeOrder = (index) => {
    if (orders.length > 1) {
      const newOrders = orders.filter((_, i) => i !== index);
      setOrders(newOrders);
      
      // Remove errors for this order
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const updateOrder = (index, field, value) => {
    const newOrders = [...orders];
    newOrders[index] = { ...newOrders[index], [field]: value };
    
    // Auto-calculate duration if start and end times are provided
    if (field === 'start_time' || field === 'end_time') {
      const order = newOrders[index];
      if (order.start_time && order.end_time) {
        try {
          const [startHours, startMinutes] = order.start_time.split(':').map(Number);
          const [endHours, endMinutes] = order.end_time.split(':').map(Number);
          
          const startTotalMinutes = startHours * 60 + startMinutes;
          let endTotalMinutes = endHours * 60 + endMinutes;
          
          // Handle overnight deliveries
          if (endTotalMinutes < startTotalMinutes) {
            endTotalMinutes += 24 * 60;
          }
          
          const durationMinutes = endTotalMinutes - startTotalMinutes;
          
          if (durationMinutes > 0 && durationMinutes < 24 * 60) {
            newOrders[index].duration_minutes = durationMinutes.toString();
          }
        } catch (error) {
          console.error('Error calculating duration:', error);
        }
      }
    }
    
    setOrders(newOrders);
    
    // Clear error for this field
    if (errors[index]?.[field]) {
      const newErrors = { ...errors };
      delete newErrors[index][field];
      if (Object.keys(newErrors[index]).length === 0) {
        delete newErrors[index];
      }
      setErrors(newErrors);
    }
  };

  const validateOrders = () => {
    const newErrors = {};
    let hasErrors = false;

    orders.forEach((order, index) => {
      const orderErrors = {};

      // Required fields
      if (!order.date) orderErrors.date = 'Date is required';
      if (!order.start_time) orderErrors.start_time = 'Start time is required';
      if (!order.end_time) orderErrors.end_time = 'End time is required';
      if (!order.duration_minutes) orderErrors.duration_minutes = 'Duration is required';
      if (!order.pay) orderErrors.pay = 'Pay is required';
      if (!order.miles) orderErrors.miles = 'Miles is required';

      // Validation rules
      if (order.duration_minutes && (parseInt(order.duration_minutes) < 1 || parseInt(order.duration_minutes) > 1440)) {
        orderErrors.duration_minutes = 'Duration must be between 1 and 1440 minutes';
      }
      
      if (order.pay && parseFloat(order.pay) < 0) {
        orderErrors.pay = 'Pay cannot be negative';
      }
      
      if (order.miles && parseFloat(order.miles) < 0) {
        orderErrors.miles = 'Miles cannot be negative';
      }

      if (Object.keys(orderErrors).length > 0) {
        newErrors[index] = orderErrors;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleSubmit = async () => {
    if (!validateOrders()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format orders data
      const formattedOrders = orders.map(order => ({
        ...order,
        duration_minutes: parseInt(order.duration_minutes),
        pay: parseFloat(order.pay),
        miles: parseFloat(order.miles),
        tip: order.tip ? parseFloat(order.tip) : 0,
        base_pay: order.base_pay ? parseFloat(order.base_pay) : 0,
        peak_pay: order.peak_pay ? parseFloat(order.peak_pay) : 0,
        notes: order.notes || ''
      }));

      await onSubmit(formattedOrders);
    } catch (error) {
      console.error('Error submitting orders:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const importedOrders = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          const order = createEmptyOrder();
          
          headers.forEach((header, index) => {
            const value = values[index]?.trim() || '';
            
            switch (header) {
              case 'date':
                order.date = value;
                break;
              case 'start_time':
              case 'start time':
                order.start_time = value;
                break;
              case 'end_time':
              case 'end time':
                order.end_time = value;
                break;
              case 'duration_minutes':
              case 'duration (min)':
              case 'duration':
                order.duration_minutes = value;
                break;
              case 'pay':
              case 'total pay':
                order.pay = value;
                break;
              case 'miles':
                order.miles = value;
                break;
              case 'tip':
                order.tip = value;
                break;
              case 'base_pay':
              case 'base pay':
                order.base_pay = value;
                break;
              case 'peak_pay':
              case 'peak pay':
                order.peak_pay = value;
                break;
              case 'notes':
                order.notes = value;
                break;
            }
          });
          
          importedOrders.push(order);
        }
        
        if (importedOrders.length > 0) {
          setOrders(importedOrders);
          setErrors({});
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const downloadTemplate = () => {
    const csvContent = [
      'Date,Start Time,End Time,Duration (min),Pay,Miles,Tip,Base Pay,Peak Pay,Notes',
      '2024-01-01,18:00,19:30,90,15.50,8.2,5.00,2.50,3.00,Example order'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doordash-orders-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <motion.div
      className="bulk-order-form-overlay"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className="bulk-order-form-modal"
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bulk-order-form-header">
          <h2>Bulk Import Orders</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="bulk-order-form-content">
          {/* Import Options */}
          <div className="import-options">
            <div className="import-option">
              <label htmlFor="csv-import" className="btn btn-secondary">
                <Upload size={16} />
                Import CSV
              </label>
              <input
                id="csv-import"
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                style={{ display: 'none' }}
              />
            </div>
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={downloadTemplate}
            >
              <Download size={16} />
              Download Template
            </button>
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addOrder}
            >
              <Plus size={16} />
              Add Row
            </button>
          </div>

          {/* Orders Table */}
          <div className="orders-table-container">
            <div className="orders-table">
              <div className="table-header">
                <div className="header-cell">Date</div>
                <div className="header-cell">Start</div>
                <div className="header-cell">End</div>
                <div className="header-cell">Duration</div>
                <div className="header-cell">Pay</div>
                <div className="header-cell">Miles</div>
                <div className="header-cell">Tip</div>
                <div className="header-cell">Base</div>
                <div className="header-cell">Peak</div>
                <div className="header-cell">Notes</div>
                <div className="header-cell">Actions</div>
              </div>

              {orders.map((order, index) => (
                <div key={index} className="table-row">
                  <div className="table-cell">
                    <input
                      type="date"
                      value={order.date}
                      onChange={(e) => updateOrder(index, 'date', e.target.value)}
                      className={`table-input ${errors[index]?.date ? 'error' : ''}`}
                    />
                    {errors[index]?.date && (
                      <span className="field-error">{errors[index].date}</span>
                    )}
                  </div>

                  <div className="table-cell">
                    <input
                      type="time"
                      value={order.start_time}
                      onChange={(e) => updateOrder(index, 'start_time', e.target.value)}
                      className={`table-input ${errors[index]?.start_time ? 'error' : ''}`}
                    />
                    {errors[index]?.start_time && (
                      <span className="field-error">{errors[index].start_time}</span>
                    )}
                  </div>

                  <div className="table-cell">
                    <input
                      type="time"
                      value={order.end_time}
                      onChange={(e) => updateOrder(index, 'end_time', e.target.value)}
                      className={`table-input ${errors[index]?.end_time ? 'error' : ''}`}
                    />
                    {errors[index]?.end_time && (
                      <span className="field-error">{errors[index].end_time}</span>
                    )}
                  </div>

                  <div className="table-cell">
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={order.duration_minutes}
                      onChange={(e) => updateOrder(index, 'duration_minutes', e.target.value)}
                      className={`table-input ${errors[index]?.duration_minutes ? 'error' : ''}`}
                      placeholder="min"
                    />
                    {errors[index]?.duration_minutes && (
                      <span className="field-error">{errors[index].duration_minutes}</span>
                    )}
                  </div>

                  <div className="table-cell">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={order.pay}
                      onChange={(e) => updateOrder(index, 'pay', e.target.value)}
                      className={`table-input ${errors[index]?.pay ? 'error' : ''}`}
                      placeholder="$"
                    />
                    {errors[index]?.pay && (
                      <span className="field-error">{errors[index].pay}</span>
                    )}
                  </div>

                  <div className="table-cell">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={order.miles}
                      onChange={(e) => updateOrder(index, 'miles', e.target.value)}
                      className={`table-input ${errors[index]?.miles ? 'error' : ''}`}
                      placeholder="mi"
                    />
                    {errors[index]?.miles && (
                      <span className="field-error">{errors[index].miles}</span>
                    )}
                  </div>

                  <div className="table-cell">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={order.tip}
                      onChange={(e) => updateOrder(index, 'tip', e.target.value)}
                      className="table-input"
                      placeholder="$"
                    />
                  </div>

                  <div className="table-cell">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={order.base_pay}
                      onChange={(e) => updateOrder(index, 'base_pay', e.target.value)}
                      className="table-input"
                      placeholder="$"
                    />
                  </div>

                  <div className="table-cell">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={order.peak_pay}
                      onChange={(e) => updateOrder(index, 'peak_pay', e.target.value)}
                      className="table-input"
                      placeholder="$"
                    />
                  </div>

                  <div className="table-cell">
                    <input
                      type="text"
                      value={order.notes}
                      onChange={(e) => updateOrder(index, 'notes', e.target.value)}
                      className="table-input"
                      placeholder="Notes..."
                    />
                  </div>

                  <div className="table-cell">
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeOrder(index)}
                      disabled={orders.length === 1}
                      title="Remove order"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bulk-summary">
            <div className="summary-item">
              <span>Total Orders:</span>
              <span>{orders.length}</span>
            </div>
            <div className="summary-item">
              <span>Total Pay:</span>
              <span>
                ${orders.reduce((sum, order) => sum + (parseFloat(order.pay) || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="summary-item">
              <span>Total Miles:</span>
              <span>
                {orders.reduce((sum, order) => sum + (parseFloat(order.miles) || 0), 0).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || orders.length === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Creating Orders...
                </>
              ) : (
                `Create ${orders.length} Orders`
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BulkOrderForm;