import { render, screen, waitFor } from '@testing-library/react'
import { FeaturedListings } from '../FeaturedListings'
import { server } from '../../../test-helpers/msw-server-bridge'
import { FeaturedListingDTO } from '@/types/dto'
import { mockFeaturedVenues } from '../featuredVenuesMockData'

const mockListings: FeaturedListingDTO[] = mockFeaturedVenues

describe('FeaturedListings', () => {
  // Server lifecycle is handled globally in jest.setup.ts
  afterEach(() => {
    server.resetHandlers()
  })
  it('renders loading state initially', () => {
    render(<FeaturedListings />)
    expect(screen.getByText(/loading featured listings/i)).toBeInTheDocument()
  })

  it('renders featured listings after successful fetch', async () => {
    render(<FeaturedListings />)

    // Assert using the fixture to avoid hard-coded text coupling
    expect(await screen.findByText(mockListings[0].name)).toBeInTheDocument()

  })

  it('renders default UI under local MSW mock', async () => {
    render(<FeaturedListings />)
    // Smoke assertion: heading renders
    expect(
      await screen.findByRole('heading', { name: /Featured Sustainable Venues/i, level: 2 })
    ).toBeInTheDocument()
  })
})