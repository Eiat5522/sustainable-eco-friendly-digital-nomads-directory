import request from 'supertest';

// Assumes Next.js dev server is running at http://localhost:3000 for API tests
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

describe('Preview API (Jest + supertest)', () => {
  // allow longer for server warmup
  jest.setTimeout(60000);

  it('enters preview mode when secret is valid (agent)', async () => {
    const agent = request.agent(baseURL);

    const res = await agent
      .get('/api/preview')
      .query({ secret: process.env.PREVIEW_SECRET || 'dev-secret', slug: '/' })
      .timeout({ deadline: 30000, response: 15000 });

    expect(res.status).toBe(307);
    expect(res.headers.location).toBeDefined();

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(Array.isArray(setCookie)).toBe(true);
  });

  it('exits preview mode using persisted cookies (agent)', async () => {
    const agent = request.agent(baseURL);

    // Enter preview to obtain cookies
    const enter = await agent
      .get('/api/preview')
      .query({ secret: process.env.PREVIEW_SECRET || 'dev-secret', slug: '/' })
      .timeout({ deadline: 30000, response: 15000 });

    expect(enter.status).toBe(307);

    // Now call exit-preview with the same agent (cookies persisted)
    const exit = await agent
      .get('/api/exit-preview')
      .timeout({ deadline: 30000, response: 15000 });

    expect(exit.status).toBe(307);
    expect(exit.headers.location).toBeDefined();
  });
});
