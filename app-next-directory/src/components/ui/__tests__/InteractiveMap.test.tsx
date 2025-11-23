import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as L from 'leaflet';
import { InteractiveMap } from '../InteractiveMap';

// Mock Leaflet
jest.mock(
  'leaflet',
  () => {
    const createMapInstance = () => {
      const instance: any = {
        setView: jest.fn().mockImplementation(function (this: any) {
          return this;
        }),
        remove: jest.fn(),
        whenReady: jest.fn(callback => {
          if (typeof callback === 'function') {
            callback();
          }
          return instance;
        }),
        invalidateSize: jest.fn(),
      };
      return instance;
    };

    const createMarkerInstance = () => {
      let popupInstance: { setContent: jest.Mock } | null = null;
      return {
        addTo: jest.fn().mockReturnThis(),
        bindPopup: jest.fn(function (this: any, content) {
          if (!popupInstance) {
            popupInstance = { setContent: jest.fn().mockReturnThis() };
          }
          if (content) {
            popupInstance.setContent(content);
          }
          return this;
        }),
        getPopup: jest.fn(() => popupInstance),
      };
    };

    const createTileLayerInstance = () => ({
      addTo: jest.fn().mockReturnThis(),
      on: jest.fn(),
      off: jest.fn(),
      remove: jest.fn(),
    });

    const leafletMock = {
      map: jest.fn(() => createMapInstance()),
      marker: jest.fn(() => createMarkerInstance()),
      divIcon: jest.fn(),
      tileLayer: jest.fn(() => createTileLayerInstance()),
    };

    return {
      __esModule: true,
      default: leafletMock,
      ...leafletMock,
    };
  },
  { virtual: true }
);

describe('InteractiveMap', () => {
  const mockLocation = { lat: 51.505, lng: -0.09 };
  let tileLayerInstance: {
    addTo: jest.Mock;
    on: jest.Mock;
    off: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    tileLayerInstance = {
      addTo: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      off: jest.fn(),
      remove: jest.fn(),
    };
    (L.default.tileLayer as jest.Mock).mockImplementation(() => tileLayerInstance);
    // Restore map mock implementation in case a test overrides it
    (L.default.map as jest.Mock).mockImplementation(() => ({
      setView: jest.fn().mockReturnThis(),
      remove: jest.fn(),
      whenReady: jest.fn(cb => cb()),
      invalidateSize: jest.fn(),
    }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeAll(() => {
    (global as any).requestAnimationFrame = (callback: any) => {
      if (typeof callback === 'function') {
        callback(0);
      }
      return 0;
    };
  });

  it('renders the map when a location is provided', async () => {
    render(<InteractiveMap location={mockLocation} name="Test Venue" />);
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
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

  it('renders the map with the correct initial view and custom marker', async () => {
    render(<InteractiveMap location={mockLocation} name="Test Venue" />);
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(L.default.map).toHaveBeenCalled();
    const mapInstance = (L.default.map as jest.Mock).mock.results[0].value;
    expect(mapInstance.setView).toHaveBeenCalledWith([mockLocation.lat, mockLocation.lng], 15);
    expect(L.default.divIcon).toHaveBeenCalled();
  });

  it('displays an error message when map tiles fail to load', async () => {
    tileLayerInstance.on.mockImplementation(function (this: any, event, callback) {
      if (event === 'tileerror') {
        callback({
          error: new Error('Failed to load'),
          tile: document.createElement('img'),
          coords: { x: 0, y: 0, z: 0 },
        });
      }
      return this;
    });

    render(<InteractiveMap location={mockLocation} name="Test Venue" />);
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(screen.getByText('Map tiles are unavailable right now.')).toBeInTheDocument();
  });

  it('updates the marker popup when name or address props change', async () => {
    const { rerender } = render(
      <InteractiveMap location={mockLocation} name="Old Name" address="Old Address" />
    );
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Get the first marker instance and its popup
    const firstMarkerInstance = (L.default.marker as jest.Mock).mock.results[0].value;
    const firstPopup = firstMarkerInstance.getPopup();
    expect(firstPopup).not.toBeNull();
    expect(firstPopup.setContent).toHaveBeenCalledTimes(1);

    rerender(<InteractiveMap location={mockLocation} name="New Name" address="New Address" />);

    // After rerender, a second marker is created (first useEffect reruns because name/address are in deps)
    // and the second useEffect also runs to update the popup
    // So we check the second marker's popup
    const secondMarkerInstance = (L.default.marker as jest.Mock).mock.results[1].value;
    const secondPopup = secondMarkerInstance.getPopup();
    expect(secondPopup.setContent).toHaveBeenCalledTimes(2); // Once in bindPopup, once in second useEffect
    const newContent = (secondPopup.setContent as jest.Mock).mock.calls[1][0];
    expect(newContent.innerHTML).toContain('New Name');
    expect(newContent.innerHTML).toContain('New Address');
  });

  it('cleans up the map instance and tile layer on unmount', async () => {
    const { unmount } = render(<InteractiveMap location={mockLocation} name="Test Venue" />);
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const mapInstance = (L.default.map as jest.Mock).mock.results[0].value;
    unmount();

    expect(mapInstance.remove).toHaveBeenCalled();
    expect(tileLayerInstance.off).toHaveBeenCalledWith('load', expect.any(Function));
    expect(tileLayerInstance.off).toHaveBeenCalledWith('tileerror', expect.any(Function));
    expect(tileLayerInstance.remove).toHaveBeenCalled();
  });

  it('re-initializes the map when the location prop changes', async () => {
    const { rerender } = render(<InteractiveMap location={mockLocation} name="Test Venue" />);
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const oldMapInstance = (L.default.map as jest.Mock).mock.results[0].value;
    const newLocation = { lat: 52.52, lng: 13.405 };
    rerender(<InteractiveMap location={newLocation} name="Test Venue" />);
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(oldMapInstance.remove).toHaveBeenCalled();
    expect(L.default.map).toHaveBeenCalledTimes(2);
    const newMapInstance = (L.default.map as jest.Mock).mock.results[1].value;
    expect(newMapInstance.setView).toHaveBeenCalledWith([newLocation.lat, newLocation.lng], 15);
  });

  it('shows an error if map initialization fails', async () => {
    (L.default.map as jest.Mock).mockImplementation(() => {
      throw new Error('Map init failed');
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<InteractiveMap location={mockLocation} name="Test Venue" />);
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByText('Map tiles are unavailable right now.')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load map:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('handles different tile error formats', async () => {
    const errorCases = [
      { error: { message: 'Network error' } },
      { error: { code: 'ERR_CONNECTION_RESET' } },
      { error: 'String error' },
      { error: null },
      { error: new Error('Instance of Error') },
    ];
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    for (const errorCase of errorCases) {
      tileLayerInstance.on.mockImplementation(function (this: any, event, callback) {
        if (event === 'tileerror') {
          callback({
            ...errorCase,
            tile: document.createElement('img'),
            coords: { x: 0, y: 0, z: 0 },
          });
        }
        return this;
      });

      const { unmount } = render(<InteractiveMap location={mockLocation} name="Test Venue" />);
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(screen.getByText('Map tiles are unavailable right now.')).toBeInTheDocument();
      unmount();
    }
    consoleWarnSpy.mockRestore();
  });

  it('binds a new popup if one does not exist on update', async () => {
    let popupInstance: any = null;
    const markerInstance = {
      addTo: jest.fn().mockReturnThis(),
      bindPopup: jest.fn(function (this: any, content) {
        popupInstance = { setContent: jest.fn().mockReturnValue(this) };
        if (content) popupInstance.setContent(content);
        return this;
      }),
      getPopup: jest.fn(() => popupInstance),
    };
    (L.default.marker as jest.Mock).mockImplementation(() => markerInstance);

    const { rerender } = render(
      <InteractiveMap location={mockLocation} name="Old Name" address="Old Address" />
    );
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    popupInstance = null; // Simulate no popup
    rerender(<InteractiveMap location={mockLocation} name="New Name" address="New Address" />);

    expect(markerInstance.bindPopup).toHaveBeenCalledTimes(2);
    const newContent = (markerInstance.bindPopup as jest.Mock).mock.calls[1][0];
    expect(newContent.innerHTML).toContain('New Name');
    expect(newContent.innerHTML).toContain('New Address');
  });

  it('creates a marker with the correct location and popup content', async () => {
    render(<InteractiveMap location={mockLocation} name="Cool Place" address="123 Main St" />);
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check if marker is created with the right location
    expect(L.default.marker).toHaveBeenCalledWith(
      [mockLocation.lat, mockLocation.lng],
      expect.any(Object)
    );

    // Check the content of the popup
    const markerInstance = (L.default.marker as jest.Mock).mock.results[0].value;
    const popupContent = (markerInstance.bindPopup as jest.Mock).mock.calls[0][0];
    expect(popupContent.innerHTML).toContain('Cool Place');
    expect(popupContent.innerHTML).toContain('123 Main St');
  });
});
