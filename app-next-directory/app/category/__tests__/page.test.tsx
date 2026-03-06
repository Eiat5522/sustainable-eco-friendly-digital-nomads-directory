/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe('Legacy category index redirect', () => {
  beforeEach(() => {
    mockRedirect.mockReset();
  });

  it('redirects /category to /categories', async () => {
    const Page = (await import('../page')).default;
    Page();
    expect(mockRedirect).toHaveBeenCalledWith('/categories');
  });
});
