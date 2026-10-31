const request = require('supertest');
const app = require('../server');

describe('SentinelScan REST API Endpoints', () => {
  describe('GET /api/health', () => {
    test('returns healthy status and metadata', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.product).toBe('SentinelScan Security Platform');
    });
  });

  describe('Authentication Security & Protected Routes', () => {
    test('POST /api/auth/register fails with 400 when missing parameters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'bad' });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/auth/login fails with 400 when missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/auth/me rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/websites rejects request without token with 401', async () => {
      const res = await request(app).get('/api/websites');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/dashboard/stats rejects request without token with 401', async () => {
      const res = await request(app).get('/api/dashboard/stats');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/reports/12345/pdf rejects request without token with 401', async () => {
      const res = await request(app).get('/api/reports/12345/pdf');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/reports/12345/csv rejects request without token with 401', async () => {
      const res = await request(app).get('/api/reports/12345/csv');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('404 Handling', () => {
    test('returns structured 404 JSON for unknown routes', async () => {
      const res = await request(app).get('/api/non-existent-endpoint');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
