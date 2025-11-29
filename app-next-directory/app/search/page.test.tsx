import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { SearchParamRecord } from '@/types/search';

const headerRenderMock = jest.fn(() => <header data-testid="header" />);
const footerRenderMock = jest.fn(() => <footer data-testid="footer" />);
const searchPageContentMock = jest.fn(({ searchParams }: { searchParams: SearchParamRecord }) => (
  <div data-testid="search-page-content" data-params={JSON.stringify(searchParams)}>
    Search Content
  </div>
));

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  Header: headerRenderMock,
}));

jest.mock('@/components/layout/Footer', () => ({
  __esModule: true,
  Footer: footerRenderMock,
}));

jest.mock('./SearchPageContent', () => ({
  __esModule: true,
  default: (props: { searchParams: SearchParamRecord }) => searchPageContentMock(props),
}));

let SearchPage: typeof import('./page').default;

beforeAll(async () => {
  const pageModule = await import('./page');
  SearchPage = pageModule.default;
});

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header, footer, and search page content', async () => {
    const searchParams = Promise.resolve({
      q: 'eco hubs',
      destination: ['bangkok'],
    } as SearchParamRecord);
    const page = await SearchPage({ searchParams });
    render(page);

    expect(headerRenderMock).toHaveBeenCalledTimes(1);
    expect(footerRenderMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('search-page-content')).toBeInTheDocument();
  });

  it('passes resolved searchParams to SearchPageContent', async () => {
    const searchParams = Promise.resolve({
      q: 'eco hubs',
      destination: ['bangkok'],
      limit: '24',
    } as SearchParamRecord);
    const page = await SearchPage({ searchParams });
    render(page);

    expect(searchPageContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchParams: { q: 'eco hubs', destination: ['bangkok'], limit: '24' },
      })
    );
  });

  it('defaults to empty params when searchParams is undefined', async () => {
    const page = await SearchPage({});
    render(page);

    expect(searchPageContentMock).toHaveBeenCalledWith(
      expect.objectContaining({ searchParams: {} })
    );
  });
});
