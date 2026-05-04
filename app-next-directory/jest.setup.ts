import { Request as NodeRequest, Response as NodeResponse } from 'node-fetch';
if (typeof global.Request === 'undefined') {
  (global as any).Request = NodeRequest;
}
if (typeof global.Response === 'undefined') {
  (global as any).Response = NodeResponse;
}
