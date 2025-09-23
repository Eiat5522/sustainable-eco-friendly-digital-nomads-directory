import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
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

    // Assert all listings render (order-agnostic, avoids coupling to first item)
    for (const { name } of mockListings) {
      expect(await screen.findByText(name)).toBeInTheDocument()
    }

  })

  it('renders default UI under local MSW mock', async () => {
    render(<FeaturedListings />)
    // Smoke assertion: heading renders
    expect(
      await screen.findByRole('heading', { name: /Featured Sustainable Venues/i, level: 2 })
    ).toBeInTheDocument()
  })

  it('renders an error state when the API fails', async () => {
    server.use(
      http.get('/api/featured-listings', () => HttpResponse.json({ error: 'boom' }, { status: 500 }))
    )

    render(<FeaturedListings />)

    expect(
      await screen.findByText(/failed to load featured listings\. please try again\./i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('allows the user to retry after a transient failure', async () => {
    let attempts = 0
    server.use(
      http.get('/api/featured-listings', () => {
        attempts += 1
        if (attempts === 1) {
          return HttpResponse.json({ error: 'temporary failure' }, { status: 500 })
        }

        return HttpResponse.json({ listings: mockListings })
      })
    )

    const user = userEvent.setup()
    render(<FeaturedListings />)

    expect(
      await screen.findByText(/failed to load featured listings\. please try again\./i)
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /retry/i }))

    for (const { name } of mockListings) {
      expect(await screen.findByText(name)).toBeInTheDocument()
    }

    expect(attempts).toBeGreaterThanOrEqual(2)
  })
})