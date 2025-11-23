import type { TestData } from '.';
import {
  integrationCities,
  integrationFavorites,
  integrationListings,
  integrationReviews,
  integrationUsers,
} from '.';

export interface IntegrationFixturesSummary {
  listings: number;
  users: number;
  cities: number;
  favorites: number;
  reviews: number;
}

export const summaryOrder: Array<keyof IntegrationFixturesSummary> = [
  'listings',
  'users',
  'cities',
  'favorites',
  'reviews',
];

export function buildIntegrationFixturesSummary(): IntegrationFixturesSummary {
  return {
    listings: integrationListings.length,
    users: integrationUsers.length,
    cities: integrationCities.length,
    favorites: integrationFavorites.length,
    reviews: integrationReviews.length,
  };
}

export default function IntegrationFixturesPage(): React.JSX.Element {
  const summary = buildIntegrationFixturesSummary();

  return (
    <main data-testid="integration-fixtures-page">
      <header>
        <h1>Integration Test Fixtures</h1>
        <p>
          Static dataset used by integration suites to simulate listings, users, cities, favorites
          and reviews.
        </p>
      </header>

      <section aria-label="Fixture summary" data-testid="fixture-summary">
        <dl>
          {summaryOrder.map(key => (
            <div key={key} data-testid={`fixture-summary-${key}`}>
              <dt>{key}</dt>
              <dd data-testid={`fixture-summary-${key}-value`}>{summary[key]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Fixture listings" data-testid="fixture-listings">
        <h2>Listings</h2>
        <ul>
          {integrationListings.map((listing: TestData['listings'][number]) => (
            <li key={listing._id} data-testid="fixture-listing-item">
              <span data-testid="fixture-listing-name">{listing.name}</span>
              <span data-testid="fixture-listing-city">{listing.city?.name ?? 'Unknown City'}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
