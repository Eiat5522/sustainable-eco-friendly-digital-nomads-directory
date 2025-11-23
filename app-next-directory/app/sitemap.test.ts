import { jest } from '@jest/globals'
import sitemap from './sitemap'
import { client } from '@/lib/sanity/client'
import type { MetadataRoute } from 'next'

// Mock the sanity client
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}))

const mockedClient = client as jest.Mocked<typeof client>

describe('sitemap', () => {
  const OLD_ENV = process.env
  const baseUrl = 'https://example.com'

  beforeEach(() => {
    jest.resetModules() // Clear cache
    process.env = { ...OLD_ENV, NEXT_PUBLIC_SITE_URL: baseUrl }
    mockedClient.fetch.mockReset()
  })

  afterAll(() => {
    process.env = OLD_ENV // Restore old environment
  })

  it('should generate a sitemap with static and dynamic URLs', async () => {
    mockedClient.fetch.mockResolvedValueOnce([
      { slug: 'listing-1', _updatedAt: '2023-01-01T00:00:00Z' },
      { slug: 'listing-2', _updatedAt: '2023-01-02T00:00:00Z' },
      { slug: null, _updatedAt: '2023-01-03T00:00:00Z' },
      { slug: 'listing-3', _updatedAt: null },
    ])
    mockedClient.fetch.mockResolvedValueOnce([
      { slug: 'city-1' },
      { slug: 'city-2' },
      { slug: null },
    ])

    const result = await sitemap()

    expect(result).toHaveLength(7) // 3 static, 2 listings, 2 cities

    expect(result).toContainEqual({
      url: baseUrl,
      lastModified: expect.any(Date),
      changeFrequency: 'daily',
      priority: 1.0,
    })

    expect(result).toContainEqual({
      url: `${baseUrl}/listings/listing-1`,
      lastModified: new Date('2023-01-01T00:00:00Z'),
      changeFrequency: 'weekly',
      priority: 0.7,
    })

     expect(result).toContainEqual({
      url: `${baseUrl}/cities/city-1`,
      lastModified: expect.any(Date),
      changeFrequency: 'weekly',
      priority: 0.6,
    })

    expect(mockedClient.fetch).toHaveBeenCalledTimes(2)
  })

  it('should fall back to only static pages if fetching fails', async () => {
    mockedClient.fetch.mockRejectedValue(new Error('Sanity fetch failed'))

    const result = await sitemap()

    expect(result).toHaveLength(3)
    expect(result.map(item => item.url)).toEqual([
      baseUrl,
      `${baseUrl}/listings`,
      `${baseUrl}/cities`,
    ])
  })

  it('should handle empty arrays from sanity client', async () => {
     mockedClient.fetch.mockResolvedValueOnce([]) // listings
     mockedClient.fetch.mockResolvedValueOnce([]) // cities

     const result = await sitemap()

     expect(result).toHaveLength(3)
  })

  it('should use localhost as baseUrl if NEXT_PUBLIC_SITE_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    mockedClient.fetch.mockRejectedValue(new Error('fail'))

    const result = await sitemap()

    expect(result[0].url).toBe('http://localhost:3001')
  })
})
