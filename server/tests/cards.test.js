import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('GET /api/cards', () => {
  it('returns cards manifest with 29 cards and 4 video tiers', async () => {
    const res = await request(app).get('/api/cards');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cards');
    expect(Array.isArray(res.body.cards)).toBe(true);
    expect(res.body.cards.length).toBe(29);

    const firstCard = res.body.cards[0];
    expect(firstCard).toHaveProperty('id');
    expect(firstCard).toHaveProperty('name');
    expect(firstCard).toHaveProperty('category');
    expect(firstCard).toHaveProperty('image');
    expect(firstCard).toHaveProperty('poster');
    expect(firstCard).toHaveProperty('fontFamily');

    // Verify video cards have 4 tiers
    const videoCard = res.body.cards.find(c => c.videos);
    expect(videoCard).toBeDefined();
    expect(videoCard.videos).toHaveProperty('low');
    expect(videoCard.videos).toHaveProperty('mid');
    expect(videoCard.videos).toHaveProperty('high');
    expect(videoCard.videos).toHaveProperty('max');
  });
});
