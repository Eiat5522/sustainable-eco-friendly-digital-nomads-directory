import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

type LegacyCityPageModule = typeof import('../page');
type LegacyCityProps = Parameters<LegacyCityPageModule['default']>[0];

const permanentRedirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  permanentRedirect: permanentRedirectMock,
}));

let LegacyCityAlias: (props: LegacyCityProps) => void;

beforeAll(async () => {
  ({ default: LegacyCityAlias } = await import('../page'));
});

beforeEach(() => {
  permanentRedirectMock.mockClear();
});

describe('LegacyCityAlias page', () => {
  it('permanently redirects to the updated city route', () => {
    LegacyCityAlias({ params: { slug: 'barcelona' } });

    expect(permanentRedirectMock).toHaveBeenCalledTimes(1);
    expect(permanentRedirectMock).toHaveBeenCalledWith('/cities/barcelona');
  });

  it('encodes complex slugs before redirecting', () => {
    LegacyCityAlias({ params: { slug: 'São Paulo' } });

    expect(permanentRedirectMock).toHaveBeenCalledWith('/cities/S%C3%A3o%20Paulo');
  });
});
