// @jest-environment node
import request, { Response, SuperTest, Test } from 'supertest';
import { createServer, Server as HttpServer, IncomingMessage, ServerResponse } from 'http';
// import next from 'next';

interface HelloApiResponse {
  // Define the expected shape of the /api/hello response here if known
  // message: string;
  [key: string]: unknown;
}

// const dev: boolean = process.env.NODE_ENV !== 'production';
// const app = next({ dev, dir: './app-next-directory' });
// const handle: (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => void = app.getRequestHandler();
// let server: HttpServer;

beforeAll(async (): Promise<void> => {
  // await app.prepare();
  // server = createServer((req: IncomingMessage, res: ServerResponse<IncomingMessage>) => handle(req, res)).listen(3001);
});

afterAll((): void => {
  // if (server && server.close) {
  //   server.close();
  // }
});
describe('API Integration Test', () => {
  Test('GET /api/hello returns status 200', async (): Promise<void> => {
    const res: Response = await request(server).get('/api/hello');
    expect(res.status).toBe(200);
    // TODO: Add further assertions to validate response body
    // Example: const body: HelloApiResponse = res.body;
  });

  // Add additional tests for your API routes as needed
});

// TODO: Uncomment and use the above code when the 'next' module is available in the test environment.
