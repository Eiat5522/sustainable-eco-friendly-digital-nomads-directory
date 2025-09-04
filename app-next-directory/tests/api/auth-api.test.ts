// API integration test using Jest + supertest
import request from 'supertest';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const email = process.env.TEST_USER_EMAIL as string;
const password = process.env.TEST_USER_PASSWORD as string;
const itIf = baseUrl && email && password ? it : it.skip;

describe('POST /api/auth/signin', () => {
  itIf('returns 200 with token', async () => {

    const res = await request(baseUrl)
      .post('/api/auth/signin')
      .send({ email, password })
      .timeout(10000)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(res.body).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(10);
  });
});
