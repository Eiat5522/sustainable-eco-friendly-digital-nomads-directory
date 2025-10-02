import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListingDetailView } from '../ListingDetailView'
import type { ListingDetailDTO, CityDTO } from '@/types/dto'
import { getCurrentHref, redirectTo } from '@/utils/navigation'
import { usePathname } from 'next/navigation'

const originalFetch = global.fetch
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
const originalHref = window.location.href
const defaultListingHref = 'http://localhost/listings/test-listing'

jest.mock('@/utils/navigation', () => ({
  getCurrentHref: jest.fn(),
  redirectTo: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockGetCurrentHref = getCurrentHref as jest.MockedFunction<typeof getCurrentHref>
const mockRedirectTo = redirectTo as jest.MockedFunction<typeof redirectTo>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

const mockResponse = (
  body: unknown,
  init: { status?: number; statusText?: string; ok?: boolean } = {}
) => {
  const status = init.status ?? 200
  const ok = init.ok ?? (status >= 200 && status < 300)
  return {
    ok,
    status,
    statusText: init.statusText ?? 'OK',
    json: jest.fn().mockResolvedValue(body),
  }
}

jest.mock('../GalleryGrid', () => {
  return function MockGalleryGrid({ images }: { images: string[] }) {
    return (
      <div data-testid="gallery-grid" data-image-count={images.length}>
        Gallery Grid
      </div>
    )
  }
})

jest.mock('../HeroSection', () => {
  return {
    HeroSection: function MockHeroSection({
      listing,
      isFavorited,
      onToggleFavorite,
    }: {
      listing: ListingDetailDTO
      isFavorited: boolean
      onToggleFavorite?: () => void
    }) {
      return (
        <div data-testid="hero-section">
          <h1 data-testid="hero-title">{listing.name}</h1>
          <button data-testid="favorite-button" onClick={onToggleFavorite}>
            {isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          </button>
        </div>
      )
    },
  }
})

jest.mock('../ListingDetailsCard', () => {
  return {
    ListingDetailsCard: function MockListingDetailsCard() {
      return <div data-testid="listing-details-card">Listing Details</div>
    },
  }
})

jest.mock('../ReviewsSection', () => {
  return {
    ReviewsSection: function MockReviewsSection({
      reviews,
      listingId,
      isSignedIn,
    }: {
      reviews: Array<{ id: string }>
      listingId: string
      isSignedIn: boolean
    }) {
      return (
        <div data-testid="reviews-section" data-listing-id={listingId} data-signed-in={isSignedIn}>
          <div data-testid="reviews-count">{reviews.length}</div>
          <div data-testid="signin-status">{isSignedIn ? 'signed-in' : 'not-signed-in'}</div>
        </div>
      )
    },
  }
})

jest.mock('../RelatedListings', () => {
  return {
    RelatedListings: function MockRelatedListings({ listings }: { listings: Array<{ id: string }> }) {
      return (
        <div data-testid="related-listings" data-count={listings.length}>
          Related Listings
        </div>
      )
    },
  }
})

beforeEach(() => {
  jest.clearAllMocks()
  mockFetch.mockReset()
  global.fetch = mockFetch as unknown as typeof fetch
  window.history.replaceState({}, '', defaultListingHref)
  mockGetCurrentHref.mockReturnValue(defaultListingHref)
  mockUsePathname.mockReturnValue('/listings/test-listing')
})

afterAll(() => {
  global.fetch = originalFetch
  window.history.replaceState({}, '', originalHref)
})

const mockCity: CityDTO = {
  id: 'city-1',
  name: 'Test City',
  country: 'Test Country',
  slug: 'test-city',
  imageUrl: '/test-city.jpg',
  description: 'Test city description',
  population: 100000,
  averageCost: 1000,
  currency: 'USD',
  timezone: 'UTC',
  language: 'English',
  climate: 'Temperate',
  internetSpeed: 50,
  safetyRating: 4.5,
  nomadFriendliness: 4.0,
  seoTitle: 'Test City SEO',
  seoDescription: 'Test city SEO description',
  tags: [],
  featuredListings: [],
  coordinates: { lat: 0, lng: 0 },
}

const baseListing: ListingDetailDTO = {
  id: 'test-listing',
  name: 'Test Listing',
  slug: 'test-listing',
  imageUrl: '/listing.jpg',
  city: mockCity,
  priceRange: 'moderate',
  shortDescription: 'A test listing',
  description: 'Detailed description',
  website: 'https://test.com',
  address: '123 Test St',
  amenities: ['wifi'],
  sustainabilityFeatures: ['solar'],
  galleryImages: ['/gallery1.jpg', '/gallery2.jpg'],
  ecoFocusTags: ['eco-friendly'],
  rating: 4.5,
  reviewCount: 10,
  isFeatured: false,
  status: 'active',
  seoTitle: 'Test Listing SEO',
  seoDescription: 'Test listing SEO description',
}

const baseReviews = [
  {
    id: 'review-1',
    rating: 5,
    comment: 'Great place!',
    user: { name: 'John Doe', image: '/john.jpg' },
    createdAt: '2023-01-01',
  },
]

describe('ListingDetailView', () => {
  it('renders core sections of the listing detail page', () => {
    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        relatedListings={[{ id: 'related-1', name: 'Related', slug: 'related', imageUrl: '/related.jpg', city: mockCity, priceRange: 'budget', ecoFocusTags: [] }]}
        isSignedIn
        isFavorited={false}
      />
    )

    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByTestId('listing-details-card')).toBeInTheDocument()
    expect(screen.getByTestId('reviews-section')).toHaveAttribute('data-listing-id', 'test-listing')
    expect(screen.getByTestId('gallery-grid')).toHaveAttribute('data-image-count', '2')
    expect(screen.getByTestId('related-listings')).toHaveAttribute('data-count', '1')
  })

  it('applies default props when optional values are omitted', () => {
    render(<ListingDetailView listing={baseListing} />)

    expect(screen.getByTestId('reviews-section')).toHaveAttribute('data-listing-id', 'test-listing')
    expect(screen.getByTestId('reviews-count')).toHaveTextContent('0')
    expect(screen.getByTestId('signin-status')).toHaveTextContent('not-signed-in')
  })

  it('omits the gallery when no images are provided', () => {
    const listingWithoutImages = { ...baseListing, galleryImages: [] }

    render(
      <ListingDetailView
        listing={listingWithoutImages}
        reviews={baseReviews}
        isSignedIn
        isFavorited={false}
      />
    )

    expect(screen.queryByTestId('gallery-grid')).not.toBeInTheDocument()
  })

  it('does not render related listings when none are passed', () => {
    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        relatedListings={[]}
        isSignedIn
        isFavorited={false}
      />
    )

    expect(screen.queryByTestId('related-listings')).not.toBeInTheDocument()
  })

  it('passes authentication state through to the reviews section', () => {
    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        isSignedIn={false}
        isFavorited={false}
      />
    )

    expect(screen.getByTestId('signin-status')).toHaveTextContent('not-signed-in')
  })

  it('redirects unauthenticated users to login when toggling favorites', async () => {
    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        isSignedIn={false}
        isFavorited={false}
      />
    )

    const button = screen.getByTestId('favorite-button')
    await userEvent.click(button)

    expect(mockGetCurrentHref).toHaveBeenCalled()
    expect(mockRedirectTo).toHaveBeenCalledWith(
      '/auth/login?callbackUrl=http%3A%2F%2Flocalhost%2Flistings%2Ftest-listing'
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls the favorites API and updates the button label on success', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ favorited: true }) as unknown as Awaited<ReturnType<typeof fetch>>
    )

    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        isSignedIn
        isFavorited={false}
      />
    )

    const button = screen.getByTestId('favorite-button')
    await userEvent.click(button)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/user/favorites/${baseListing.slug}`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    await waitFor(() => {
      expect(button).toHaveTextContent('Remove from favorites')
    })
  })

  it('updates local state when the API returns an unfavorited state', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ favorited: false }) as unknown as Awaited<ReturnType<typeof fetch>>
    )

    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        isSignedIn
        isFavorited
      />
    )

    const button = screen.getByTestId('favorite-button')
    expect(button).toHaveTextContent('Remove from favorites')

    await userEvent.click(button)

    await waitFor(() => {
      expect(button).toHaveTextContent('Add to favorites')
    })
  })

  it('redirects to login when the API returns 401', async () => {
    mockFetch.mockResolvedValue(
      mockResponse(
        { error: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized', ok: false }
      ) as unknown as Awaited<ReturnType<typeof fetch>>
    )

    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        isSignedIn
        isFavorited={false}
      />
    )

    const button = screen.getByTestId('favorite-button')
    await userEvent.click(button)

    await waitFor(() => {
      expect(mockGetCurrentHref).toHaveBeenCalled()
      expect(mockRedirectTo).toHaveBeenCalledWith(
        '/auth/login?callbackUrl=http%3A%2F%2Flocalhost%2Flistings%2Ftest-listing'
      )
    })
  })

  it('logs an error when the API responds with a non-success status', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockResolvedValue(
      mockResponse(
        { error: 'Server error' },
        { status: 500, statusText: 'Internal Server Error', ok: false }
      ) as unknown as Awaited<ReturnType<typeof fetch>>
    )

    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        isSignedIn
        isFavorited={false}
      />
    )

    await userEvent.click(screen.getByTestId('favorite-button'))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle favorite:', 500, 'Internal Server Error')
    })

    consoleSpy.mockRestore()
  })

  it('logs an error when the favorites request rejects', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValue(new Error('Network down'))

    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        isSignedIn
        isFavorited={false}
      />
    )

    await userEvent.click(screen.getByTestId('favorite-button'))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle favorite:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('does not record views when pathname is not a listing detail page', async () => {
    // Mock pathname to be home page instead of listing detail
    mockUsePathname.mockReturnValue('/')

    // Temporarily enable production mode to verify view recording doesn't happen
    const originalNodeEnv = process.env.NODE_ENV
    const originalJestWorkerId = process.env.JEST_WORKER_ID
    delete process.env.JEST_WORKER_ID
    process.env.NODE_ENV = 'production'

    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        isSignedIn
        isFavorited={false}
      />
    )

    // Wait a bit to ensure no fetch is triggered
    await new Promise((resolve) => setTimeout(resolve, 100))

    // View recording API should NOT be called since we're not on a listing page
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/listings/'),
      expect.any(Object)
    )

    // Restore environment
    process.env.NODE_ENV = originalNodeEnv
    if (originalJestWorkerId) process.env.JEST_WORKER_ID = originalJestWorkerId
  })

  it('does not record views when pathname is on other pages like search', async () => {
    // Mock pathname to be search page
    mockUsePathname.mockReturnValue('/search')

    // Temporarily enable production mode to verify view recording doesn't happen
    const originalNodeEnv = process.env.NODE_ENV
    const originalJestWorkerId = process.env.JEST_WORKER_ID
    delete process.env.JEST_WORKER_ID
    process.env.NODE_ENV = 'production'

    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        isSignedIn
        isFavorited={false}
      />
    )

    // Wait a bit to ensure no fetch is triggered
    await new Promise((resolve) => setTimeout(resolve, 100))

    // View recording API should NOT be called
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/listings/'),
      expect.any(Object)
    )

    // Restore environment
    process.env.NODE_ENV = originalNodeEnv
    if (originalJestWorkerId) process.env.JEST_WORKER_ID = originalJestWorkerId
  })
})
