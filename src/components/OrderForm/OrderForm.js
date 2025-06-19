import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, Calendar, Clock, DollarSign, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import './OrderForm.css';

const OrderForm = ({ 
  order = null, 
  onSubmit, 
  onClose, 
  isEditing = false 
}) => {
  const [isCalculatingDuration, setIsCalculatingDuration] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: order || {
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
    }
  });

  const watchedStartTime = watch('start_time');
  const watchedEndTime = watch('end_time');

  // Auto-calculate duration when start and end times change
  useEffect(() => {
    if (watchedStartTime && watchedEndTime) {
      setIsCalculatingDuration(true);
      
      try {
        const [startHours, startMinutes] = watchedStartTime.split(':').map(Number);
        const [endHours, endMinutes] = watchedEndTime.split(':').map(Number);
        
        const startTotalMinutes = startHours * 60 + startMinutes;
        let endTotalMinutes = endHours * 60 + endMinutes;
        
        // Handle overnight deliveries
        if (endTotalMinutes < startTotalMinutes) {
          endTotalMinutes += 24 * 60; // Add 24 hours
        }
        
        const durationMinutes = endTotalMinutes - startTotalMinutes;
        
        if (durationMinutes > 0 && durationMinutes < 24 * 60) {
          setValue('duration_minutes', durationMinutes);
        }
      } catch (error) {
        console.error('Error calculating duration:', error);
      }
      
      setIsCalculatingDuration(false);
    }
  }, [watchedStartTime, watchedEndTime, setValue]);

  const onFormSubmit = async (data) => {
    // Convert string values to numbers
    const formattedData = {
      ...data,
      duration_minutes: parseInt(data.duration_minutes),
      pay: parseFloat(data.pay),
      miles: parseFloat(data.miles),
      tip: data.tip ? parseFloat(data.tip) : 0,
      base_pay: data.base_pay ? parseFloat(data.base_pay) : 0,
      peak_pay: data.peak_pay ? parseFloat(data.peak_pay) : 0,
      notes: data.notes || ''
    };

    await onSubmit(formattedData);
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <motion.div
      className="order-form-overlay"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className="order-form-modal"
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="order-form-header">
          <h2>{isEditing ? 'Edit Order' : 'New Order'}</h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="order-form">
          <div className="form-grid">
            {/* Date */}
            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} />
                Date
              </label>
              <input
                type="date"
                className={`form-input ${errors.date ? 'error' : ''}`}
                {...register('date', { required: 'Date is required' })}
              />
              {errors.date && (
                <span className="form-error">{errors.date.message}</span>
              )}
            </div>

            {/* Start Time */}
            <div className="form-group">
              <label className="form-label">
                <Clock size={16} />
                Start Time
              </label>
              <input
                type="time"
                className={`form-input ${errors.start_time ? 'error' : ''}`}
                {...register('start_time', { required: 'Start time is required' })}
              />
              {errors.start_time && (
                <span className="form-error">{errors.start_time.message}</span>
              )}
            </div>

            {/* End Time */}
            <div className="form-group">
              <label className="form-label">
                <Clock size={16} />
                End Time
              </label>
              <input
                type="time"
                className={`form-input ${errors.end_time ? 'error' : ''}`}
                {...register('end_time', { required: 'End time is required' })}
              />
              {errors.end_time && (
                <span className="form-error">{errors.end_time.message}</span>
              )}
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label">
                <Clock size={16} />
                Duration (minutes)
                {isCalculatingDuration && <span className="calculating">Calculating...</span>}
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                className={`form-input ${errors.duration_minutes ? 'error' : ''}`}
                {...register('duration_minutes', { 
                  required: 'Duration is required',
                  min: { value: 1, message: 'Duration must be at least 1 minute' },
                  max: { value: 1440, message: 'Duration cannot exceed 24 hours' }
                })}
              />
              {errors.duration_minutes && (
                <span className="form-error">{errors.duration_minutes.message}</span>
              )}
            </div>

            {/* Total Pay */}
            <div className="form-group">
              <label className="form-label">
                <DollarSign size={16} />
                Total Pay
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-input ${errors.pay ? 'error' : ''}`}
                {...register('pay', { 
                  required: 'Total pay is required',
                  min: { value: 0, message: 'Pay cannot be negative' }
                })}
              />
              {errors.pay && (
                <span className="form-error">{errors.pay.message}</span>
              )}
            </div>

            {/* Miles */}
            <div className="form-group">
              <label className="form-label">
                <MapPin size={16} />
                Miles
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                className={`form-input ${errors.miles ? 'error' : ''}`}
                {...register('miles', { 
                  required: 'Miles is required',
                  min: { value: 0, message: 'Miles cannot be negative' }
                })}
              />
              {errors.miles && (
                <span className="form-error">{errors.miles.message}</span>
              )}
            </div>
          </div>

          {/* Pay Breakdown Section */}
          <div className="pay-breakdown-section">
            <h3>Pay Breakdown (Optional)</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Base Pay</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  {...register('base_pay')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tip</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  {...register('tip')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Peak Pay</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  {...register('peak_pay')}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={16} />
              Notes (Optional)
            </label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Add any notes about this delivery..."
              {...register('notes')}
            />
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
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Order' : 'Create Order'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default OrderForm;