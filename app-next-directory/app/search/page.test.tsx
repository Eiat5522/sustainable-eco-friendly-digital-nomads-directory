import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import type { SearchParamRecord } from '@/types/search'

const headerRenderMock = jest.fn(() => <header data-testid="header" />)
const footerRenderMock = jest.fn(() => <footer data-testid="footer" />)
const searchFiltersFormMock = jest.fn((props: { initialParams: SearchParamRecord }) => (
  <div data-testid="search-filters-form" data-initial-params={JSON.stringify(props.initialParams)} />
))

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  Header: headerRenderMock,
}))

jest.mock('@/components/layout/Footer', () => ({
  __esModule: true,
  Footer: footerRenderMock,
}))

jest.mock('@/components/search/SearchFiltersForm', () => ({
  __esModule: true,
  SearchFiltersForm: (props: { initialParams: SearchParamRecord }) => searchFiltersFormMock(props),
}))

let SearchPage: typeof import('./page').default
let dynamicExport: string

beforeAll(async () => {
  const module = await import('./page')
  SearchPage = module.default
  dynamicExport = module.dynamic
})

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('exposes a force-dynamic rendering hint', () => {
    expect(dynamicExport).toBe('force-dynamic')
  })

  it('renders layout chrome and forwards resolved search params to the filters form', async () => {
    const searchParams = Promise.resolve({ q: 'eco hubs', destination: ['bangkok'], limit: '24' } satisfies SearchParamRecord)

    const page = await SearchPage({ searchParams })
    render(page)

    expect(headerRenderMock).toHaveBeenCalledTimes(1)
    expect(footerRenderMock).toHaveBeenCalledTimes(1)

    const heading = await screen.findByRole('heading', { name: 'Search for Sustainable Venues' })
    expect(heading).toBeInTheDocument()

    expect(searchFiltersFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialParams: { q: 'eco hubs', destination: ['bangkok'], limit: '24' },
      }),
    )
  })

  it('defaults to empty params when searchParams is undefined', async () => {
    const page = await SearchPage({})
    render(page)

    expect(searchFiltersFormMock).toHaveBeenCalledWith(expect.objectContaining({ initialParams: {} }))
  })

  it('treats a null searchParams resolution as an empty parameter object', async () => {
    const page = await SearchPage({
      searchParams: Promise.resolve(null as unknown as SearchParamRecord),
    })

    render(page)

    expect(headerRenderMock).toHaveBeenCalled()
    expect(footerRenderMock).toHaveBeenCalled()
    expect(searchFiltersFormMock).toHaveBeenCalledWith(expect.objectContaining({ initialParams: {} }))
  })
})
