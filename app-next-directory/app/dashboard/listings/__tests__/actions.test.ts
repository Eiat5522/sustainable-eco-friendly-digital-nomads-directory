/** @jest-environment node */

import { auth } from '@/lib/auth';
import {
  createManagedListing,
  updateManagedListing,
} from '@/lib/data-access/listing-management.dal';
import { structuredLogger } from '@/lib/logger';
import { createListingAction, updateListingAction } from '../actions';

jest.mock('@/lib/auth');
jest.mock('@/lib/data-access/listing-management.dal');
jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreateManagedListing = createManagedListing as jest.MockedFunction<
  typeof createManagedListing
>;
const mockUpdateManagedListing = updateManagedListing as jest.MockedFunction<
  typeof updateManagedListing
>;

describe('Listing Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createListingAction', () => {
    const mockListingData = {
      title: 'Test Listing',
      description: 'Test Description',
      category: 'coworking',
      city: 'Test City',
      country: 'Test Country',
    };

    it('should create a listing successfully with authenticated user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'venueOwner' as const,
        },
      };
      const mockCreatedListing = { id: 'listing-123', ...mockListingData };

      mockAuth.mockResolvedValue(mockSession);
      mockCreateManagedListing.mockResolvedValue(mockCreatedListing);

      const result = await createListingAction(mockListingData);

      expect(mockAuth).toHaveBeenCalled();
      expect(mockCreateManagedListing).toHaveBeenCalledWith(mockListingData, {
        id: 'user-123',
        role: 'venueOwner',
      });
      expect(result).toEqual(mockCreatedListing);
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ user: undefined });

      await expect(createListingAction(mockListingData)).rejects.toThrow('Unauthorized');
      expect(mockCreateManagedListing).not.toHaveBeenCalled();
    });

    // Define a type for testing malformed sessions
    type MalformedSession = { user: Partial<{ id: string; role: string }> };

    it('should throw error when session user has no id', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'venueOwner' } } as unknown as MalformedSession);

      await expect(createListingAction(mockListingData)).rejects.toThrow('Unauthorized');
      expect(mockCreateManagedListing).not.toHaveBeenCalled();
    });

    it('should throw error when session user has no role', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);

      await expect(createListingAction(mockListingData)).rejects.toThrow('Unauthorized');
      expect(mockCreateManagedListing).not.toHaveBeenCalled();
    });

    it('should log error and rethrow when createManagedListing fails', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'venueOwner' as const,
        },
      };
      const mockError = new Error('Database error');

      mockAuth.mockResolvedValue(mockSession);
      mockCreateManagedListing.mockRejectedValue(mockError);

      await expect(createListingAction(mockListingData)).rejects.toThrow('Database error');
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to create listing via action',
        mockError,
        { component: 'listing-actions' }
      );
    });

    it('should handle null session', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(createListingAction(mockListingData)).rejects.toThrow('Unauthorized');
      expect(mockCreateManagedListing).not.toHaveBeenCalled();
    });
  });

  describe('updateListingAction', () => {
    const mockListingId = 'listing-123';
    const mockListingData = {
      title: 'Updated Listing',
      description: 'Updated Description',
      category: 'coworking',
      city: 'Updated City',
      country: 'Updated Country',
    };

    it('should update a listing successfully with authenticated user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'venueOwner' as const,
        },
      };
      const mockUpdatedListing = { id: mockListingId, ...mockListingData };

      mockAuth.mockResolvedValue(mockSession);
      mockUpdateManagedListing.mockResolvedValue(mockUpdatedListing);

      const result = await updateListingAction(mockListingId, mockListingData);

      expect(mockAuth).toHaveBeenCalled();
      expect(mockUpdateManagedListing).toHaveBeenCalledWith(mockListingId, mockListingData, {
        id: 'user-123',
        role: 'venueOwner',
      });
      expect(result).toEqual(mockUpdatedListing);
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ user: undefined });

      await expect(updateListingAction(mockListingId, mockListingData)).rejects.toThrow(
        'Unauthorized'
      );
      expect(mockUpdateManagedListing).not.toHaveBeenCalled();
    });

    it('should throw error when session user has no id', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'venueOwner' } } as never);

      await expect(updateListingAction(mockListingId, mockListingData)).rejects.toThrow(
        'Unauthorized'
      );
      expect(mockUpdateManagedListing).not.toHaveBeenCalled();
    });

    it('should throw error when session user has no role', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);

      await expect(updateListingAction(mockListingId, mockListingData)).rejects.toThrow(
        'Unauthorized'
      );
      expect(mockUpdateManagedListing).not.toHaveBeenCalled();
    });

    it('should log error with listingId and rethrow when updateManagedListing fails', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'venueOwner' as const,
        },
      };
      const mockError = new Error('Update failed');

      mockAuth.mockResolvedValue(mockSession);
      mockUpdateManagedListing.mockRejectedValue(mockError);

      await expect(updateListingAction(mockListingId, mockListingData)).rejects.toThrow(
        'Update failed'
      );
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to update listing via action',
        mockError,
        {
          component: 'listing-actions',
          listingId: mockListingId,
        }
      );
    });

    it('should handle null session', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(updateListingAction(mockListingId, mockListingData)).rejects.toThrow(
        'Unauthorized'
      );
      expect(mockUpdateManagedListing).not.toHaveBeenCalled();
    });
  });
});
