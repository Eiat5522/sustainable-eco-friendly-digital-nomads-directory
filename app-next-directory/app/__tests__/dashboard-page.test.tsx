const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    redirectMock.mockReset();
  });

  it('redirects to the consolidated profile page', async () => {
    redirectMock.mockImplementation(() => {
      const error = new Error('REDIRECT');
      (error as Error & { digest?: string }).digest = 'NEXT_REDIRECT';
      throw error;
    });

    jest.resetModules();
    const pageModule = await import('../dashboard/page');

    await expect(() => pageModule.default()).toThrow('REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/profile');
  });
});
