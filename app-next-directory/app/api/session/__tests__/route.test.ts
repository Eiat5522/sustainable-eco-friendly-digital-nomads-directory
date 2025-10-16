import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';

describe('/api/session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST returns success', async () => {
    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.success).toBe(true);
    expect(json.data.ok).toBe(true);
  });
});
