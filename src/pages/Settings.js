import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import './Settings.css';

const Settings = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const api = useApi();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Get all orders
      const orders = await api.get('/orders?limit=200');
      
      if (!orders.orders || orders.orders.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Create comprehensive CSV
      const csvContent = [
        ['Date', 'Start Time', 'End Time', 'Duration (min)', 'Total Pay', 'Miles', 'Tip', 'Base Pay', 'Peak Pay', 'Pay/Hour', 'Pay/Mile', 'Notes'],
        ...orders.orders.map(order => [
          order.date,
          order.start_time,
          order.end_time,
          order.duration_minutes,
          order.pay.toFixed(2),
          order.miles.toFixed(1),
          (order.tip || 0).toFixed(2),
          (order.base_pay || 0).toFixed(2),
          (order.peak_pay || 0).toFixed(2),
          (order.pay / (order.duration_minutes / 60)).toFixed(2),
          (order.pay / order.miles).toFixed(2),
          order.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doordash-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${orders.orders.length} orders successfully!`);
    } catch (error) {
      toast.error('Failed to export data: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const orders = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          const order = {};
          
          headers.forEach((header, index) => {
            const value = values[index]?.trim() || '';
            
            switch (header) {
              case 'date':
                order.date = value;
                break;
              case 'start time':
              case 'start_time':
                order.start_time = value;
                break;
              case 'end time':
              case 'end_time':
                order.end_time = value;
                break;
              case 'duration (min)':
              case 'duration_minutes':
              case 'duration':
                order.duration_minutes = parseInt(value) || 0;
                break;
              case 'total pay':
              case 'pay':
                order.pay = parseFloat(value) || 0;
                break;
              case 'miles':
                order.miles = parseFloat(value) || 0;
                break;
              case 'tip':
                order.tip = parseFloat(value) || 0;
                break;
              case 'base pay':
              case 'base_pay':
                order.base_pay = parseFloat(value) || 0;
                break;
              case 'peak pay':
              case 'peak_pay':
                order.peak_pay = parseFloat(value) || 0;
                break;
              case 'notes':
                order.notes = value;
                break;
            }
          });
          
          // Validate required fields
          if (order.date && order.start_time && order.end_time && order.duration_minutes && order.pay && order.miles) {
            orders.push(order);
          }
        }
        
        if (orders.length > 0) {
          await api.post('/orders/bulk', orders);
          toast.success(`Successfully imported ${orders.length} orders!`);
        } else {
          toast.error('No valid orders found in the file');
        }
      } catch (error) {
        toast.error('Failed to import data: ' + error.message);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleClearData = async () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      return;
    }

    setIsClearing(true);
    try {
      // Get all orders first
      const orders = await api.get('/orders?limit=200');
      
      if (!orders.orders || orders.orders.length === 0) {
        toast.error('No data to clear');
        setShowClearConfirm(false);
        return;
      }

      // Delete all orders
      const deletePromises = orders.orders.map(order => 
        api.delete(`/orders/${order.id}`)
      );
      
      await Promise.all(deletePromises);
      
      toast.success(`Successfully cleared ${orders.orders.length} orders!`);
      setShowClearConfirm(false);
    } catch (error) {
      toast.error('Failed to clear data: ' + error.message);
    } finally {
      setIsClearing(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      await api.get('/health');
      toast.success('Server connection successful!');
    } catch (error) {
      toast.error('Server connection failed: ' + error.message);
    }
  };

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
      className="settings-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="settings-header" variants={itemVariants}>
        <div className="settings-title">
          <h1>Settings</h1>
          <p>Manage your DoorDash Tracker preferences and data</p>
        </div>
      </motion.div>

      {/* Settings Sections */}
      <div className="settings-content">
        {/* Data Management */}
        <motion.div className="settings-section" variants={itemVariants}>
          <div className="section-header">
            <Database size={24} />
            <div className="section-title">
              <h3>Data Management</h3>
              <p>Import, export, and manage your delivery data</p>
            </div>
          </div>

          <div className="section-content">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Export Data</h4>
                <p>Download all your delivery data as a CSV file for backup or analysis in other tools.</p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <div className="spinner"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export CSV
                  </>
                )}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Import Data</h4>
                <p>Upload a CSV file to import delivery data. Make sure the format matches the export format.</p>
              </div>
              <label htmlFor="import-file" className="btn btn-secondary">
                <Upload size={16} />
                Import CSV
              </label>
              <input
                id="import-file"
                type="file"
                accept=".csv"
                onChange={handleImportData}
                style={{ display: 'none' }}
              />
            </div>

            <div className="setting-item danger">
              <div className="setting-info">
                <h4>Clear All Data</h4>
                <p>Permanently delete all delivery records. This action cannot be undone.</p>
              </div>
              <button
                className={`btn ${showClearConfirm ? 'btn-danger' : 'btn-secondary'}`}
                onClick={handleClearData}
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <div className="spinner"></div>
                    Clearing...
                  </>
                ) : showClearConfirm ? (
                  <>
                    <AlertTriangle size={16} />
                    Confirm Clear
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Clear Data
                  </>
                )}
              </button>
              {showClearConfirm && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* System Information */}
        <motion.div className="settings-section" variants={itemVariants}>
          <div className="section-header">
            <Info size={24} />
            <div className="section-title">
              <h3>System Information</h3>
              <p>Application details and server status</p>
            </div>
          </div>

          <div className="section-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Application Version</span>
                <span className="info-value">1.0.0</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Database</span>
                <span className="info-value">SQLite</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Server Status</span>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleTestConnection}
                >
                  <RefreshCw size={14} />
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* About */}
        <motion.div className="settings-section" variants={itemVariants}>
          <div className="section-header">
            <CheckCircle size={24} />
            <div className="section-title">
              <h3>About DoorDash Tracker</h3>
              <p>Track and analyze your DoorDash delivery performance</p>
            </div>
          </div>

          <div className="section-content">
            <div className="about-content">
              <p>
                DoorDash Tracker is a comprehensive tool designed to help delivery drivers 
                track their earnings, analyze performance metrics, and optimize their delivery strategy.
              </p>
              
              <div className="features-list">
                <h4>Features:</h4>
                <ul>
                  <li>Track individual delivery orders with detailed metrics</li>
                  <li>Analyze earnings by hour, day, and custom date ranges</li>
                  <li>Monitor pay per hour and pay per mile performance</li>
                  <li>Visualize trends and patterns in your delivery data</li>
                  <li>Export data for external analysis</li>
                  <li>Bulk import orders from CSV files</li>
                </ul>
              </div>

              <div className="tips-section">
                <h4>Tips for Better Tracking:</h4>
                <ul>
                  <li>Record orders immediately after completion for accuracy</li>
                  <li>Include detailed notes about peak times and locations</li>
                  <li>Regularly review your analytics to identify patterns</li>
                  <li>Use the bulk import feature for historical data</li>
                  <li>Export your data regularly as a backup</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Settings;