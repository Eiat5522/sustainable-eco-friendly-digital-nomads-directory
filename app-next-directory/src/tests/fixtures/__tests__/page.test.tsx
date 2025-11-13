import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import React from 'react'

import IntegrationFixturesPage, {
  buildIntegrationFixturesSummary,
  summaryOrder,
} from '@/tests/fixtures/page'
import {
  integrationCities,
  integrationFavorites,
  integrationListings,
  integrationReviews,
  integrationUsers,
} from '@/tests/fixtures'

describe('IntegrationFixturesPage', () => {
  it('renders a summary card for each data collection with the correct counts', () => {
    const summary = buildIntegrationFixturesSummary()

    render(<IntegrationFixturesPage />)

    summaryOrder.forEach((key) => {
      const card = screen.getByTestId(`fixture-summary-${key}`)
      expect(card).toBeInTheDocument()

      const value = within(card).getByTestId(`fixture-summary-${key}-value`)
      expect(value).toHaveTextContent(String(summary[key]))
    })
  })

  it('lists every integration listing alongside its city', () => {
    render(<IntegrationFixturesPage />)

    const items = screen.getAllByTestId('fixture-listing-item')
    expect(items).toHaveLength(integrationListings.length)

    items.forEach((item, index) => {
      const listing = integrationListings[index]
      expect(within(item).getByTestId('fixture-listing-name')).toHaveTextContent(listing.name)

      const expectedCityName = listing.city?.name ?? 'Unknown City'
      expect(within(item).getByTestId('fixture-listing-city')).toHaveTextContent(expectedCityName)
    })
  })

  it('keeps the summary counts aligned with the exported integration fixtures', () => {
    const summary = buildIntegrationFixturesSummary()

    expect(summary.listings).toBe(integrationListings.length)
    expect(summary.users).toBe(integrationUsers.length)
    expect(summary.cities).toBe(integrationCities.length)
    expect(summary.favorites).toBe(integrationFavorites.length)
    expect(summary.reviews).toBe(integrationReviews.length)
  })
})
