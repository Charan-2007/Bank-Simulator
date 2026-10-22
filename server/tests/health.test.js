import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('GET /api/health', () => {
  it('returns 200 OK and reports db status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('db', 1); // 1 = connected in replica set test harness
    expect(res.body).toHaveProperty('dbStatus', 'connected');
    expect(res.body).toHaveProperty('timestamp');
  });
});
