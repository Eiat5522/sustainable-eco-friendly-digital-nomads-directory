import request from 'supertest';

// Assumes Next.js dev server is running at http://localhost:3000 for API tests
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

describe('Preview API (Jest + supertest)', () => {
  jest.setTimeout(60000);
  it('enters preview mode when secret is valid', async () => {
    const res = await request(baseURL)
      .get('/api/preview')
      .query({ secret: process.env.PREVIEW_SECRET || 'dev-secret', slug: '/' })
      .timeout({ deadline: 30000, response: 15000 })
      .expect(307);

    // Location header should redirect
    expect(res.headers.location).toBeDefined();

    // Preview cookies should be set
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(Array.isArray(setCookie)).toBe(true);
  });

  it('exits preview mode', async () => {
    // Enter preview first to receive cookies
    const enter = await request(baseURL)
      .get('/api/preview')
      .query({ secret: process.env.PREVIEW_SECRET || 'dev-secret', slug: '/' })
      .expect(307);

    const cookies = enter.headers['set-cookie'];

    const exit = await request(baseURL)
      .get('/api/exit-preview')
      .set('Cookie', cookies)
      .timeout({ deadline: 30000, response: 15000 })
      .expect(307);

    expect(exit.headers.location).toBeDefined();
  });
});
