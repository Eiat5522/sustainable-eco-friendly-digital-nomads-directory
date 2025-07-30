import { createCustomMarker, createPopupContent } from './CustomMarker';
import L from 'leaflet';

jest.mock('leaflet', () => ({
  divIcon: jest.fn((opts) => ({ opts })),
}));

describe('CustomMarker', () => {
  const listing = {
    _id: '1',
    name: 'Test Place',
    slug: { current: 'test-place' },
    shortDescription: 'Short desc',
    type: 'cafe',
  } as any;

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('createCustomMarker uses leaflet divIcon', () => {
    const icon = createCustomMarker(listing);
    expect(L.divIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('marker-cafe'),
        className: 'custom-marker',
      })
    );
    expect(icon).toEqual({ opts: expect.any(Object) });
  });

  test('createPopupContent returns DOM structure', () => {
    const popup = createPopupContent(listing);
    expect(popup.className).toBe('listing-popup');
    expect(popup.querySelector('h3')?.innerText).toBe('Test Place');
    const link = popup.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/listings/test-place');
    expect(popup.querySelector('style')).toBeTruthy();
  });
});