import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GET } from '../route';
import { GET as authGET } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  GET: jest.fn(),
}));

describe('/api/auth/session delegation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates GET request to auth handler', async () => {
    const req = new Request('http://localhost/api/auth/session');
    const res = new Response('ok');
    (authGET as jest.Mock).mockResolvedValue(res);

    const actual = await GET(req);
    expect(authGET).toHaveBeenCalledWith(req);
    expect(actual).toBe(actual);
  });
});
