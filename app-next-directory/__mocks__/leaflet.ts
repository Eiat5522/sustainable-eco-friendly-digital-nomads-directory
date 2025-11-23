import { jest } from '@jest/globals';

const createBounds = () => ({
  getNorth: jest.fn(() => 0),
  getSouth: jest.fn(() => 0),
  getEast: jest.fn(() => 0),
  getWest: jest.fn(() => 0),
});

const mockMapInstance = {
  setView: jest.fn().mockReturnThis(),
  remove: jest.fn(),
  addLayer: jest.fn().mockReturnThis(),
  removeLayer: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  off: jest.fn().mockReturnThis(),
  fitBounds: jest.fn().mockReturnThis(),
  getBounds: jest.fn(createBounds),
  panTo: jest.fn().mockReturnThis(),
  getZoom: jest.fn(() => 13),
  setZoom: jest.fn().mockReturnThis(),
  getCenter: jest.fn(() => ({ lat: 0, lng: 0 })),
  invalidateSize: jest.fn().mockReturnThis(),
};

const mockTileLayer = {
  addTo: jest.fn().mockReturnThis(),
  remove: jest.fn(),
};

const mockMarker = {
  addTo: jest.fn().mockReturnThis(),
  bindPopup: jest.fn().mockReturnThis(),
  getPopup: jest.fn(() => ({
    setContent: jest.fn(),
  })),
  setIcon: jest.fn().mockReturnThis(),
  remove: jest.fn(),
};

const leaflet = {
  map: jest.fn(() => mockMapInstance),
  tileLayer: jest.fn(() => mockTileLayer),
  marker: jest.fn(() => mockMarker),
  divIcon: jest.fn(options => ({ ...(options as object) })),
  icon: jest.fn(options => ({ ...(options as object) })),
  layerGroup: jest.fn(() => ({ addLayer: jest.fn(), clearLayers: jest.fn() })),
  control: { zoom: { position: 'topright' } },
};

export default leaflet;
export const L = leaflet;
module.exports = leaflet;
module.exports.default = leaflet;
