import { test as setup } from '@playwright/test';
import { createTestData, getTestData, TEST_SESSION_COOKIE_NAME } from '../config/test-data';

const seeded = getTestData();

type LeafletPopupContent = HTMLElement | string;

type LeafletBounds = {
  getNorth: () => number;
  getSouth: () => number;
  getEast: () => number;
  getWest: () => number;
};

type LeafletMapInstance = {
  _el: HTMLElement;
  setView: () => LeafletMapInstance;
  remove: () => void;
  addLayer: () => LeafletMapInstance;
  on: () => LeafletMapInstance;
  off: () => LeafletMapInstance;
  getBounds: () => LeafletBounds;
  panTo: () => LeafletMapInstance;
};

type LeafletMapLike = {
  _el?: HTMLElement;
};

type LeafletMarkerInstance = {
  addTo: () => LeafletMarkerInstance;
  bindPopup: (content: LeafletPopupContent) => LeafletMarkerInstance;
  getPopup: () => { setContent: (inner: LeafletPopupContent) => void };
  setIcon: () => LeafletMarkerInstance;
  remove: () => void;
};

type LeafletMarkerFactory = {
  addTo: (target: LeafletMapLike) => LeafletMarkerFactory | LeafletMarkerInstance;
};

type LeafletIconOptions = Record<string, unknown>;

type LeafletMock = {
  map: (container: HTMLElement | string) => LeafletMapInstance;
  tileLayer: () => { addTo: () => unknown };
  marker: (position: [number, number], options?: { icon?: { html?: string } }) => LeafletMarkerFactory;
  divIcon: (opts: LeafletIconOptions) => LeafletIconOptions;
  icon: (opts: LeafletIconOptions) => LeafletIconOptions;
};

type TestWindow = Window & {
  __TEST_DATA__?: unknown;
  L?: LeafletMock;
};

const json = (data: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(data),
});

export async function globalSetup() {
  return {
    testData: createTestData(),
  };
}

export default setup('seed reusable test data', async ({ page }) => {
  await page.addInitScript(
    payload => {
      const testWindow = window as TestWindow;
      // Expose dataset for interactive debugging and component smoke tests
      testWindow.__TEST_DATA__ = payload;

      if (!testWindow.L) {
        const mapInstances = new Set<LeafletMapInstance>();
        const createBounds = () => ({
          getNorth: () => 0,
          getSouth: () => 0,
          getEast: () => 0,
          getWest: () => 0,
        });

        const createMarker = (mapEl: HTMLElement, iconHtml?: string) => {
          const markerEl = document.createElement('div');
          markerEl.className = 'leaflet-marker-icon marker-icon';
          markerEl.innerHTML = iconHtml ?? '•';
          markerEl.setAttribute('data-testid', 'mock-marker');
          markerEl.style.position = 'absolute';
          mapEl.appendChild(markerEl);
          const popupEl = document.createElement('div');
          popupEl.className = 'marker-popup hidden';
          mapEl.appendChild(popupEl);
          const markerInstance: LeafletMarkerInstance = {
            addTo() {
              return this;
            },
            bindPopup(content: LeafletPopupContent) {
              popupEl.classList.remove('hidden');
              popupEl.innerHTML = '';
              if (content instanceof HTMLElement) {
                popupEl.appendChild(content);
              } else if (typeof content === 'string') {
                popupEl.innerHTML = content;
              }
              return this;
            },
            getPopup() {
              return {
                setContent(inner: LeafletPopupContent) {
                  popupEl.innerHTML = '';
                  if (inner instanceof HTMLElement) {
                    popupEl.appendChild(inner);
                  } else if (typeof inner === 'string') {
                    popupEl.innerHTML = inner;
                  }
                },
              };
            },
            setIcon() {
              return this;
            },
            remove() {
              markerEl.remove();
              popupEl.remove();
            },
          };
          return markerInstance;
        };

        testWindow.L = {
          map: (container: HTMLElement | string) => {
            const element =
              typeof container === 'string' ? document.getElementById(container) : container;
            if (!element) {
              throw new Error('Unable to initialise mock map: container not found');
            }
            element.setAttribute('data-testid', 'mock-leaflet-map');
            const instance: LeafletMapInstance = {
              _el: element,
              setView() {
                return instance;
              },
              remove() {
                element.innerHTML = '';
                mapInstances.delete(instance);
              },
              addLayer() {
                return instance;
              },
              on() {
                return instance;
              },
              off() {
                return instance;
              },
              getBounds: createBounds,
              panTo() {
                return instance;
              },
            };
            mapInstances.add(instance);
            return instance;
          },
          tileLayer() {
            return {
              addTo() {
                return this;
              },
            };
          },
          marker(position: [number, number], options?: { icon?: { html?: string } }) {
            const [lat, lng] = position;
            const iconHtml = options?.icon?.html ?? `${lat.toFixed(2)},${lng.toFixed(2)}`;
            const markerFactory: LeafletMarkerFactory = {
              addTo(target: LeafletMapLike) {
                if (target?._el instanceof HTMLElement) {
                  return createMarker(target._el, iconHtml);
                }
                return this;
              },
            };
            return markerFactory;
          },
          divIcon(opts: LeafletIconOptions) {
            return { ...opts };
          },
          icon(opts: LeafletIconOptions) {
            return { ...opts };
          },
        };
      }
    },
    {
      listings: seeded.listings,
      cities: seeded.cities,
      favorites: seeded.favorites,
      reviews: seeded.reviews,
      users: seeded.users,
      sessionCookie: TEST_SESSION_COOKIE_NAME,
    }
  );

  // Primary listings feed (legacy route removed - now uses /api/listings)

  await page.route('**/api/listings', async route => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (pathname.endsWith('/featured')) {
      const featured = seeded.listings.slice(0, 2);
      await route.fulfill(
        json({ success: true, data: { listings: featured, total: featured.length } })
      );
      return;
    }

    const citySlug = url.searchParams.get('citySlug');
    const filtered = citySlug
      ? seeded.listings.filter(listing => listing.city.slug?.current === citySlug)
      : seeded.listings;

    await route.fulfill(
      json({
        success: true,
        data: {
          listings: filtered,
          pagination: {
            page: Number(url.searchParams.get('page') ?? '1'),
            limit: Number(url.searchParams.get('limit') ?? filtered.length),
            total: filtered.length,
            pages: 1,
          },
        },
      })
    );
  });

  await page.route('**/api/cities', async route => {
    const cityPayload = seeded.cities.map(city => ({
      id: city.id,
      name: city.name,
      slug: city.slug,
      country: city.country,
      description: city.description,
      coordinates: city.coordinates,
      sustainabilityScore: city.sustainabilityScore,
      highlights: city.highlights,
      listingCount: city.listingIds.length,
    }));
    await route.fulfill(
      json({
        cities: cityPayload,
        metadata: {
          total: cityPayload.length,
          query_time: new Date().toISOString(),
          source: 'test-fixture',
        },
      })
    );
  });

  await page.route('**/api/reviews/analytics', async route => {
    const total = seeded.reviews.length;
    const average =
      total === 0 ? 0 : seeded.reviews.reduce((sum, review) => sum + review.rating, 0) / total;
    await route.fulfill(
      json({
        totalReviews: total,
        averageRating: Number(average.toFixed(2)),
        distribution: seeded.reviews.reduce<Record<number, number>>((acc, review) => {
          acc[review.rating] = (acc[review.rating] ?? 0) + 1;
          return acc;
        }, {}),
      })
    );
  });

  await page.route('**/api/reviews', async route => {
    const url = new URL(route.request().url());
    const listing = url.searchParams.get('listingId') ?? url.searchParams.get('listing');
    const reviews = listing
      ? seeded.reviews.filter(review => review.listingId === listing)
      : seeded.reviews;
    const average =
      reviews.length === 0
        ? 0
        : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await route.fulfill(
      json({
        success: true,
        data: {
          reviews,
          totalReviews: reviews.length,
          averageRating: Number(average.toFixed(2)),
        },
      })
    );
  });

  await page.route('**/api/user/favorites', async route => {
    const defaultUser = seeded.users[0];
    const favorites = seeded.favorites
      .filter(favorite => favorite.userId === defaultUser.id)
      .map(favorite => {
        const listing = seeded.listings.find(item => item._id === favorite.listingId);
        return {
          _id: favorite.id,
          createdAt: favorite.createdAt,
          listing: listing
            ? {
                _id: listing._id,
                name: listing.name,
                slug: listing.slug?.current,
                mainImage: {
                  asset: { url: `https://images.test/listings/${listing.slug?.current}.jpg` },
                },
                city: { name: listing.city.name },
              }
            : null,
        };
      });

    await route.fulfill(json({ favorites }));
  });
});
