/**
 * Sanity Client Tests - Schema & TypeScript Refactoring Complete
 * 
 * These tests validate the Sanity client setup and configuration
 * while adhering to the new cleaned up schema and TS types structure.
 */

// Mock modules at the top level before any imports
jest.mock('@sanity/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@sanity/image-url', () => {
  const mockImageUrlBuilder = jest.fn();
  mockImageUrlBuilder.mockReturnValue({
    image: jest.fn(() => ({
      url: jest.fn(() => 'https://cdn.sanity.io/test.jpg'),
      toString: jest.fn(() => 'https://cdn.sanity.io/test.jpg'),
    })),
  });
  return mockImageUrlBuilder;
});

describe('Sanity client module', () => {
  // Mock implementations
  const mockClient = {
    config: jest.fn(() => ({
      projectId: 'test-project',
      dataset: 'test-dataset',
      apiVersion: '2024-01-01',
      useCdn: false,
    })),
    fetch: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset module cache to ensure fresh imports
    jest.resetModules();
    
    // Setup mocks for each test
    const { createClient } = require('@sanity/client');
    const imageUrlBuilder = require('@sanity/image-url');
    
    (createClient as jest.Mock).mockReturnValue(mockClient);
    
    const mockImageChain = {
      url: jest.fn(() => 'https://cdn.sanity.io/test.jpg'),
      toString: jest.fn(() => 'https://cdn.sanity.io/test.jpg'),
    };
    
    const mockBuilderInstance = {
      image: jest.fn(() => mockImageChain),
    };
    
    (imageUrlBuilder as jest.Mock).mockReturnValue(mockBuilderInstance);
  });

  describe('Client Creation', () => {
    it('should create client with environment variables', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
        NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
        SANITY_API_TOKEN: 'test-token',
      };

      const { createClient } = require('@sanity/client');
      const clientModule = require('./client'); // Fixed import path

      expect(createClient).toHaveBeenCalledWith({
        projectId: 'test-project',
        dataset: 'test-dataset',
        apiVersion: '2024-01-01',
        useCdn: false,
        token: 'test-token',
        ignoreBrowserTokenWarning: true,
      });

      expect(clientModule.client).toBe(mockClient);
      expect(clientModule.createClient).toBe(createClient);

      process.env = originalEnv;
    });

    it('should fallback to dummy values when env vars are missing', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SANITY_PROJECT_ID: '',
        NEXT_PUBLIC_SANITY_DATASET: '',
        SANITY_API_TOKEN: '',
      };

      const { createClient } = require('@sanity/client');
      const clientModule = require('./client'); // Fixed import path

      expect(createClient).toHaveBeenCalledWith({
        projectId: 'projectId',
        dataset: 'dataset',
        apiVersion: '2024-01-01',
        useCdn: false,
      });

      expect(clientModule.client).toBe(mockClient);

      process.env = originalEnv;
    });
  });

  describe('Image URL Building', () => {
    it('should build image URLs using urlFor function', () => {
      const { createClient } = require('@sanity/client');
      const imageUrlBuilder = require('@sanity/image-url');
      
      const mockImageChain = {
        url: jest.fn(() => 'https://cdn.sanity.io/test.jpg'),
        toString: jest.fn(() => 'https://cdn.sanity.io/test.jpg'),
      };
      
      const mockBuilderInstance = {
        image: jest.fn(() => mockImageChain),
      };
      
      (imageUrlBuilder as jest.Mock).mockReturnValue(mockBuilderInstance);
      
      const clientModule = require('./client'); // Fixed import path
      
      const imageSource = { 
        _ref: 'image-asset-ref',
        _type: 'reference'
      };

      expect(typeof clientModule.urlFor).toBe('function');
      
      const result = clientModule.urlFor(imageSource);
      
      expect(imageUrlBuilder).toHaveBeenCalledWith(mockClient);
      expect(mockBuilderInstance.image).toHaveBeenCalledWith(imageSource);
      expect(result).toBe(mockImageChain);
      expect(clientModule.builder).toBe(mockBuilderInstance);
    });

    it('should handle centralized image model structure', () => {
      const { createClient } = require('@sanity/client');
      const imageUrlBuilder = require('@sanity/image-url');
      
      const mockImageChain = {
        url: jest.fn(() => 'https://cdn.sanity.io/test.jpg'),
        toString: jest.fn(() => 'https://cdn.sanity.io/test.jpg'),
      };
      
      const mockBuilderInstance = {
        image: jest.fn(() => mockImageChain),
      };
      
      (imageUrlBuilder as jest.Mock).mockReturnValue(mockBuilderInstance);
      
      const clientModule = require('./client'); // Fixed import path
      
      // Test with the new centralized image model from R.5 refactoring plan
      const centralizedImageSource = {
        asset: {
          _ref: 'image-asset-ref',
          _type: 'reference'
        },
        alt: 'Test image alt text',
        caption: 'Test image caption'
      };
      
      const result = clientModule.urlFor(centralizedImageSource);
      
      expect(mockBuilderInstance.image).toHaveBeenCalledWith(centralizedImageSource);
      expect(result).toBe(mockImageChain);
    });
  });

  describe('Client Methods', () => {
    it('should provide all necessary client methods', () => {
      const clientModule = require('./client'); // Fixed import path

      expect(clientModule.client).toBe(mockClient);
      expect(clientModule.client.fetch).toBeDefined();
      expect(clientModule.client.create).toBeDefined();
      expect(clientModule.client.update).toBeDefined();
      expect(clientModule.client.delete).toBeDefined();
      expect(clientModule.client.config).toBeDefined();
    });

    it('should support GROQ queries for new schema structure', async () => {
      // Mock a successful fetch response with new field names per R.1 refactoring plan
      const mockListingResponse = {
        _id: 'listing-123',
        _type: 'listing',
        category: 'coworking', // Using 'category' as per refactoring plan
        address: '123 Test Street', // camelCase naming for address
        ecoTags: [{ _ref: 'eco-tag-1' }], // camelCase naming for eco tags
        shortDescription: 'Short description', // Split description fields
        longDescription: 'Long description',
        digitalNomadFeatures: ['wifi', 'coffee'], // camelCase naming
        primaryImage: { // Centralized image model
          asset: { _ref: 'image-ref' },
          alt: 'Primary image',
          caption: 'Image caption'
        }
      };

      mockClient.fetch.mockResolvedValue(mockListingResponse);
      
      const clientModule = require('./client'); // Fixed import path

      const query = `*[_type == "listing" && category == "coworking"][0]`;
      const result = await clientModule.client.fetch(query);

      expect(clientModule.client.fetch).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockListingResponse);
      
      // Verify new schema structure
      expect(result.category).toBe('coworking');
      expect(result.ecoTags).toBeDefined();
      expect(result.digitalNomadFeatures).toBeDefined();
      expect(result.primaryImage).toBeDefined();
      expect(result.primaryImage.asset).toBeDefined();
      expect(result.primaryImage.alt).toBeDefined();
    });
  });

  describe('Module Exports', () => {
    it('should export all required functions and instances', () => {
      const { createClient } = require('@sanity/client');
      const imageUrlBuilder = require('@sanity/image-url');
      
      const mockBuilderInstance = {
        image: jest.fn(() => ({
          url: jest.fn(() => 'https://cdn.sanity.io/test.jpg'),
          toString: jest.fn(() => 'https://cdn.sanity.io/test.jpg'),
        })),
      };
      
      (imageUrlBuilder as jest.Mock).mockReturnValue(mockBuilderInstance);
      
      const clientModule = require('./client'); // Fixed import path
      
      expect(clientModule.createClient).toBe(createClient);
      expect(clientModule.client).toBe(mockClient);
      expect(clientModule.builder).toBe(mockBuilderInstance);
      expect(clientModule.urlFor).toBeDefined();
      expect(typeof clientModule.urlFor).toBe('function');
    });
  });

  describe('Configuration Validation', () => {
    it('should use correct API version for new schema', () => {
      const { createClient } = require('@sanity/client');
      
      require('./client'); // Fixed import path
      
      expect(createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          apiVersion: '2024-01-01'
        })
      );
    });

    it('should have useCdn disabled for server-side usage', () => {
      const { createClient } = require('@sanity/client');
      
      require('./client'); // Fixed import path
      
      expect(createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          useCdn: false
        })
      );
    });
  });

  describe('Schema Refactoring Compatibility', () => {
    it('should work with R.1 normalized field names', async () => {
      // Test queries using new field structure from refactoring plan
      const normalizedQuery = `*[_type == "listing" && category match "coworking*"]{
        _id,
        category,
        address,
        shortDescription,
        longDescription,
        digitalNomadFeatures,
        ecoTags[]->
      }`;

      mockClient.fetch.mockResolvedValue([
        {
          _id: 'listing-1',
          category: 'coworking',
          address: '123 Digital St',
          shortDescription: 'Modern coworking space',
          longDescription: 'A fully equipped modern coworking space...',
          digitalNomadFeatures: ['high_speed_wifi', 'coffee_bar', 'meeting_rooms'],
          ecoTags: [
            { _ref: 'eco-tag-1', title: 'Solar Powered' },
            { _ref: 'eco-tag-2', title: 'Recycling Program' }
          ]
        }
      ]);

      const clientModule = require('./client');
      const result = await clientModule.client.fetch(normalizedQuery);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('coworking');
      expect(result[0].digitalNomadFeatures).toContain('high_speed_wifi');
      expect(result[0].ecoTags).toHaveLength(2);
    });

    it('should support R.5 centralized image model queries', async () => {
      // Test queries for the new centralized image structure
      const imageQuery = `*[_type == "listing"][0]{
        primaryImage{
          asset->{
            _id,
            url,
            metadata{
              dimensions{
                width,
                height
              }
            }
          },
          alt,
          caption
        },
        gallery[]{
          asset->{
            _id,
            url
          },
          alt,
          caption
        }
      }`;

      const mockImageResponse = {
        primaryImage: {
          asset: {
            _id: 'image-asset-1',
            url: 'https://cdn.sanity.io/primary.jpg',
            metadata: {
              dimensions: { width: 1200, height: 800 }
            }
          },
          alt: 'Main listing image',
          caption: 'Beautiful coworking space'
        },
        gallery: [
          {
            asset: {
              _id: 'image-asset-2', 
              url: 'https://cdn.sanity.io/gallery1.jpg'
            },
            alt: 'Interior view',
            caption: 'Open workspace area'
          }
        ]
      };

      mockClient.fetch.mockResolvedValue(mockImageResponse);

      const clientModule = require('./client');
      const result = await clientModule.client.fetch(imageQuery);

      expect(result.primaryImage.asset.url).toBe('https://cdn.sanity.io/primary.jpg');
      expect(result.primaryImage.alt).toBe('Main listing image');
      expect(result.gallery).toHaveLength(1);
      expect(result.gallery[0].asset.url).toBe('https://cdn.sanity.io/gallery1.jpg');
    });


  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle client creation failure gracefully', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
        NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
      };

      const { createClient } = require('@sanity/client');
      (createClient as jest.Mock).mockImplementation(() => {
        throw new Error('Client creation failed');
      });

      expect(() => require('./client')).toThrow('Client creation failed');

      process.env = originalEnv;
    });

    it('should handle urlFor with null or undefined image source', () => {
      const clientModule = require('./client');

      expect(() => clientModule.urlFor(null)).not.toThrow();
      expect(() => clientModule.urlFor(undefined)).not.toThrow();
      // Note: urlFor may return a builder chain even for invalid inputs; adjust based on actual behavior
    });

    it('should handle fetch errors', async () => {
      mockClient.fetch.mockRejectedValue(new Error('Fetch failed'));

      const clientModule = require('./client');

      await expect(clientModule.client.fetch('*[_type == "listing"]')).rejects.toThrow('Fetch failed');
    });

    it('should handle create method success and failure', async () => {
      const clientModule = require('./client');

      mockClient.create.mockResolvedValue({ _id: 'new-id' });
      const result = await clientModule.client.create({ _type: 'listing', name: 'Test' });
      expect(result._id).toBe('new-id');

      mockClient.create.mockRejectedValue(new Error('Create failed'));
      await expect(clientModule.client.create({})).rejects.toThrow('Create failed');
    });

    it('should handle update method success and failure', async () => {
      const clientModule = require('./client');

      mockClient.update.mockResolvedValue({ _id: 'updated-id' });
      const result = await clientModule.client.update('doc-id', { name: 'Updated' });
      expect(result._id).toBe('updated-id');

      mockClient.update.mockRejectedValue(new Error('Update failed'));
      await expect(clientModule.client.update('doc-id', {})).rejects.toThrow('Update failed');
    });

    it('should handle delete method success and failure', async () => {
      const clientModule = require('./client');

      mockClient.delete.mockResolvedValue('deleted');
      const result = await clientModule.client.delete('doc-id');
      expect(result).toBe('deleted');

      mockClient.delete.mockRejectedValue(new Error('Delete failed'));
      await expect(clientModule.client.delete('doc-id')).rejects.toThrow('Delete failed');
    });

    it('should handle getDocument method', async () => {
      const clientModule = require('./client');

      mockClient.getDocument.mockResolvedValue({ _id: 'doc-id', name: 'Test Doc' });
      const result = await clientModule.client.getDocument('doc-id');
      expect(result.name).toBe('Test Doc');

      mockClient.getDocument.mockRejectedValue(new Error('Get document failed'));
      await expect(clientModule.client.getDocument('invalid-id')).rejects.toThrow('Get document failed');
    });

    it('should handle partial environment variable configurations', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SANITY_PROJECT_ID: 'partial-project',
        NEXT_PUBLIC_SANITY_DATASET: '', // Missing dataset
        SANITY_API_TOKEN: 'partial-token',
      };

      const { createClient } = require('@sanity/client');
      require('./client');

      expect(createClient).toHaveBeenCalledWith({
        projectId: 'partial-project',
        dataset: 'dataset', // Falls back to dummy
        apiVersion: '2024-01-01',
        useCdn: false,
        token: 'partial-token',
        ignoreBrowserTokenWarning: true,
      });
