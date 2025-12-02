import '@testing-library/jest-dom';
import { generateAsyncValue } from '@/test-helpers/async-mock-helpers';
import { render, screen } from '@testing-library/react';

const cityDetailMock = jest.fn(({ slug }: { slug: string }) => (
  <div data-testid="city-detail-stub">city:{slug}</div>
));

jest.mock('../cities/[slug]/CityDetail', () => ({
  __esModule: true,
  CityDetail: (props: { slug: string }) => cityDetailMock(props),
}));

const originalE2E = process.env.NEXT_PUBLIC_E2E;
const originalE2EFlag = process.env.E2E;

afterEach(() => {
  process.env.NEXT_PUBLIC_E2E = originalE2E;
  process.env.E2E = originalE2EFlag;
  jest.clearAllMocks();
});

describe('CityPage (wiring)', () => {
  it('renders the CityDetail stub for a slug', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const { default: CityPage } = await import('../cities/[slug]/page');

    const element = await CityPage({ params: generateAsyncValue({ slug: 'eco-city' }) });
    render(element);

    expect(screen.getByTestId('city-detail-stub')).toHaveTextContent('eco-city');
    expect(cityDetailMock).toHaveBeenCalledWith({ slug: 'eco-city' });
  });
});
