const express = require('express');
const Joi = require('joi');
const router = express.Router();

// Validation schemas
const orderSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  start_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  end_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  duration_minutes: Joi.number().integer().min(1).required(),
  pay: Joi.number().min(0).required(),
  miles: Joi.number().min(0).required(),
  tip: Joi.number().min(0).default(0),
  base_pay: Joi.number().min(0).default(0),
  peak_pay: Joi.number().min(0).default(0),
  notes: Joi.string().allow('').default('')
});

const bulkOrderSchema = Joi.array().items(orderSchema).min(1).max(100);

// GET /api/orders - Get all orders with pagination
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    if (limit > 200) {
      return res.status(400).json({ error: 'Limit cannot exceed 200' });
    }

    const orders = await req.db.getOrders(limit, offset);
    res.json({
      orders,
      pagination: {
        limit,
        offset,
        count: orders.length
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await req.db.getOrderById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message)
      });
    }

    const order = await req.db.createOrder(value);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// POST /api/orders/bulk - Create multiple orders
router.post('/bulk', async (req, res) => {
  try {
    const { error, value } = bulkOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message)
      });
    }

    const orders = await req.db.createBulkOrders(value);
    res.status(201).json({
      message: `Successfully created ${orders.length} orders`,
      orders
    });
  } catch (error) {
    console.error('Error creating bulk orders:', error);
    res.status(500).json({ error: 'Failed to create orders' });
  }
});

// PUT /api/orders/:id - Update order
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Check if order exists
    const existingOrder = await req.db.getOrderById(id);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message)
      });
    }

    const updatedOrder = await req.db.updateOrder(id, value);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const result = await req.db.deleteOrder(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;