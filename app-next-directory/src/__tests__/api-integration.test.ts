/// <reference types="jest" />
// @jest-environment node

import request, { Response, Test } from 'supertest';
import type TestAgent from 'supertest/lib/agent';
import { createServer, Server as HttpServer, IncomingMessage, ServerResponse } from 'http';

interface HelloApiResponse {
  message: string;
}

let server: HttpServer;
let api: TestAgent<Test>;

beforeAll((): void => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === '/api/hello' && req.method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Hello from mock server' }));
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  }).listen(0);

  api = request(server);
});

afterAll((): void => {
