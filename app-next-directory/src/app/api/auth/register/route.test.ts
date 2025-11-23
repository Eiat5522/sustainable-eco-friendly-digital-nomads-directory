
import { connect } from '@/lib/dbConnect';
import User from '@/models/User';
import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock dbConnect and User model
jest.mock('@/lib/dbConnect');
jest.mock('@/models/User');

describe('/api/auth/register POST', () => {
  beforeAll(async () => {
    // Any setup needed before all tests
  });

  afterAll(async () => {
    // Any cleanup needed after all tests
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock connect to be a resolved promise
    (connect as jest.Mock).mockResolvedValue(undefined);
    // Mock User.findOne to return null (user doesn't exist)
    (User.findOne as jest.Mock).mockResolvedValue(null);
    // Mock User.create to return a new user object
    (User.create as jest.Mock).mockResolvedValue({
      _id: 'mockUserId',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      save: jest.fn().mockResolvedValue(this),
    });
  });

  it('should register a new user successfully', async () => {
    const mockRequest = {
      json: async () => ({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.message).toBe('User registered successfully');
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('test@example.com');
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test User',
        email: 'test@example.com',
      })
    );
  });

  it('should return 400 if request body is invalid', async () => {
    const mockRequest = {
      json: async () => ({
        name: 'Test User',
        // Missing email and password
      }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid request body');
    expect(body.errors).toBeDefined();
  });

  it('should return 409 if user already exists', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ email: 'existing@example.com' }); // Simulate user already exists

    const mockRequest = {
      json: async () => ({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.message).toBe('User already exists');
    expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
    expect(User.create).not.toHaveBeenCalled();
  });

  it('should return 500 if database connection fails', async () => {
    (connect as jest.Mock).mockRejectedValue(new Error('DB connection error'));

    const mockRequest = {
      json: async () => ({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal server error');
  });

   it('should return 500 if user creation fails', async () => {
    (User.create as jest.Mock).mockRejectedValue(new Error('User creation error'));

    const mockRequest = {
      json: async () => ({
        name: 'Test User',
        email: 'fail@example.com',
        password: 'password123',
      }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Error creating user');
    expect(User.create).toHaveBeenCalled();
  });
});
