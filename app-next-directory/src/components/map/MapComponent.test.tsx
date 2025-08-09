import { render } from '@testing-library/react';
import MapComponent from './MapComponent';
import L from 'leaflet';
import 'leaflet.markercluster';

const mapInstance = {
  addLayer: jest.fn(),
  on: jest.fn(),
  getBounds: jest.fn(() => ({
    getNorthEast: () => ({ equals: () => false }),
    getSouthWest: () => ({}),
  })),
  fitBounds: jest.fn(),
  remove: jest.fn(),
};
jest.mock('leaflet', () => {
  const addLayer = jest.fn();
  const clearLayers = jest.fn();
  const markerMock = jest.fn(() => ({ bindPopup: jest.fn() }));
  const markerClusterGroupInstance = { addLayer, clearLayers };
  return {
    map: jest.fn(() => mapInstance),
    tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
    marker: markerMock,
    divIcon: jest.fn(() => 'divIcon'),
    point: jest.fn(() => 'point'),
    markerClusterGroup: jest.fn(() => markerClusterGroupInstance),
    latLngBounds: jest.fn(() => ({ isValid: () => true })),
    featureGroup: jest.fn(() => ({ getBounds: jest.fn(() => ({ })) })),
    __mocks: { markerMock, markerClusterGroupInstance },
  };
});

jest.mock('leaflet.markercluster', () => ({}));

const listings = [
  { name: 'A', category: 'cafe', address: 'addr', location: { lat: 1, lng: 2 } },
  { name: 'B', category: 'coworking', address: 'addr2', location: { lat: 3, lng: 4 } },
] as any[];

afterEach(() => {
  jest.clearAllMocks();
});

test('initializes map and markers', () => {
  render(<MapComponent listings={listings} />);
  const mocks = (L as any).__mocks;
  expect(L.map).toHaveBeenCalledWith(expect.any(HTMLElement), expect.any(Object));
  expect(mocks.markerMock).toHaveBeenCalledTimes(2);
  expect(mocks.markerClusterGroupInstance.addLayer).toHaveBeenCalledTimes(2);
});

test('cleans up on unmount', () => {
  const { unmount } = render(<MapComponent listings={listings} />);
  unmount();
  expect(mapInstance.remove).toHaveBeenCalled();
});

test('calls onBoundsChange when map bounds change', () => {
  const handler = jest.fn();
  render(<MapComponent listings={listings} onBoundsChange={handler} />);
  const cb = mapInstance.on.mock.calls.find(c => c[0] === 'moveend')?.[1];
  expect(cb).toBeDefined();
  cb && cb();
  expect(handler).toHaveBeenCalled();
});