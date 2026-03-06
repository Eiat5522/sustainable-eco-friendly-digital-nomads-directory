/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe('Legacy category detail route redirect', () => {
  beforeEach(() => {
    mockRedirect.mockReset();
  });

  it('redirects /category/[slug] to /categories/[slug]', async () => {
    const Page = (await import('../page')).default;
    await Page({ params: Promise.resolve({ slug: 'coworking' }) });

    expect(mockRedirect).toHaveBeenCalledWith('/categories/coworking');
  });
});
