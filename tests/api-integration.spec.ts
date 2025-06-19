import request from 'supertest';
import { createServer } from 'http';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: './app-next-directory' });
const handle = app.getRequestHandler();
let server;

beforeAll(async () => {
  await app.prepare();
  server = createServer((req, res) => handle(req, res)).listen(3001);
});

afterAll(() => {
  if (server && server.close) {
    server.close();
  }
});

describe('API Integration Tests', () => {
  test('GET /api/hello returns status 200', async () => {
    const res = await request(server).get('/api/hello');
    expect(res.status).toBe(200);
    // TODO: Add further assertions to validate response body
  });

  // Add additional tests for your API routes as needed
});
