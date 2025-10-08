import { NextRequest } from 'next/server';

// Mock stable dependencies at the top level
jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn((body: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

// This mock needs to be at the top level to be hoisted by Jest
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
}));

describe('Registration API Routes', () => {
  // Reset modules before each test to ensure a clean state
  beforeEach(() => {
    jest.resetModules();
  });

  describe('POST /api/auth/register', () => {
    test('should register a user successfully', async () => {
      // Arrange: Mocks for this specific test case
      const mockUserCountDocuments = jest.fn().mockResolvedValue(0);
      const mockUserCreate = jest.fn().mockResolvedValue({
        toObject: () => ({
          _id: 'mock-user-id',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        }),
      });

      jest.mock('@/models/User', () => ({
        __esModule: true,
        default: {
          countDocuments: mockUserCountDocuments,
          create: mockUserCreate,
        },
      }));
      jest.mock('@/lib/dbConnect', () => ({
        __esModule: true,
        default: jest.fn().mockResolvedValue(undefined),
      }));

      // Act: Dynamically import the route to use the fresh mocks
      const { POST } = await import('./route');
      const req = {
        json: () => Promise.resolve({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      } as NextRequest;
      const response = await POST(req);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(mockUserCountDocuments).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUserCreate).toHaveBeenCalledTimes(1);
    });

    test('should return 409 if user already exists', async () => {
      // Arrange
      const mockUserCountDocuments = jest.fn().mockResolvedValue(1);
      const mockUserCreate = jest.fn();

      jest.mock('@/models/User', () => ({
        __esModule: true,
        default: {
          countDocuments: mockUserCountDocuments,
          create: mockUserCreate,
        },
      }));
      jest.mock('@/lib/dbConnect', () => ({
        __esModule: true,
        default: jest.fn().mockResolvedValue(undefined),
      }));

      // Act
      const { POST } = await import('./route');
      const req = {
        json: () => Promise.resolve({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      } as NextRequest;
      const response = await POST(req);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('User already exists');
      expect(mockUserCreate).not.toHaveBeenCalled();
    });
  });
});