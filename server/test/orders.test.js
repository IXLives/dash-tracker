const request = require('supertest');
const app = require('../index');

describe('Orders API', () => {
  test('GET /api/health should return OK', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
  });

  test('GET /api/orders should return orders array', async () => {
    const response = await request(app)
      .get('/api/orders')
      .expect(200);
    
    expect(response.body).toHaveProperty('orders');
    expect(Array.isArray(response.body.orders)).toBe(true);
  });

  test('POST /api/orders should create a new order', async () => {
    const newOrder = {
      date: '2024-01-01',
      start_time: '18:00',
      end_time: '19:30',
      duration_minutes: 90,
      pay: 15.50,
      miles: 8.2,
      tip: 5.00,
      base_pay: 2.50,
      peak_pay: 3.00,
      notes: 'Test order'
    };

    const response = await request(app)
      .post('/api/orders')
      .send(newOrder)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.pay).toBe(15.50);
  });

  test('POST /api/orders should validate required fields', async () => {
    const invalidOrder = {
      date: '2024-01-01',
      // missing required fields
    };

    await request(app)
      .post('/api/orders')
      .send(invalidOrder)
      .expect(400);
  });
});