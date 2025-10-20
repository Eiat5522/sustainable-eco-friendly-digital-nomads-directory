import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InteractiveMap } from '../InteractiveMap';
import L from 'leaflet';

// Mock Leaflet
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    remove: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    getPopup: jest.fn(() => ({
      setContent: jest.fn(),
    })),
  })),
  divIcon: jest.fn(),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
  })),
}));

describe('InteractiveMap', () => {
  const mockLocation = { lat: 51.505, lng: -0.09 };

  beforeEach(() => {
    // Clear mock history before each test
    (L.map as jest.Mock).mockClear();
    (L.marker as jest.Mock).mockClear();
    (L.tileLayer as jest.Mock).mockClear();
  });

  it('renders the map when a location is provided', async () => {
    render(<InteractiveMap location={mockLocation} name="Test Venue" />);
    // The useEffect hook that initializes the map is async, so we wait for it to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    // When location is provided, the fallback message should not be present.
    expect(screen.queryByText('Location not available')).not.toBeInTheDocument();
  });

  it('renders a fallback message when no location is provided', () => {
    render(<InteractiveMap name="Test Venue" />);
    expect(screen.getByText('Location not available')).toBeInTheDocument();
  });

  it('displays the address in the fallback message if provided', () => {
    render(<InteractiveMap name="Test Venue" address="123 Test St" />);
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
  });

  it('renders the map with the correct initial view', async () => {
    render(<InteractiveMap location={mockLocation} name="Test Venue" />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(L.map).toHaveBeenCalled();
    const mapInstance = (L.map as jest.Mock).mock.results[0].value;
    expect(mapInstance.setView).toHaveBeenCalledWith([mockLocation.lat, mockLocation.lng], 15);
  });
});
