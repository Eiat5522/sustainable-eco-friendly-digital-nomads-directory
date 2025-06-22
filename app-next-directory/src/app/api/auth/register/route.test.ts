import { POST } from './route';
import connect from '@/lib/dbConnect';
import User from '@/models/User';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/lib/dbConnect', () => ({
  connect: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('POST /api/auth/register', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a user successfully', async () => {
    // Arrange
    const req = {
      json: jest.fn().mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    } as unknown as NextRequest;

    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    (User.create as jest.Mock).mockResolvedValue({
      _id: 'someid',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    });

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(body.message).toBe('User registered successfully');
    expect(body.user.email).toBe('test@example.com');
    expect(body.user).not.toHaveProperty('password');
    expect(connect).toHaveBeenCalledTimes(1);
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(User.create).toHaveBeenCalledTimes(1);
  });

  it('should return 409 if user already exists', async () => {
    // Arrange
    const req = {
      json: jest.fn().mockResolvedValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      }),
    } as unknown as NextRequest;

    (User.findOne as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(409);
    expect(body.message).toBe('User already exists');
    expect(User.create).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid request body', async () => {
    // Arrange
    const req = {
      json: jest.fn().mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        // password missing
      }),
    } as unknown as NextRequest;

    // Act
    const response = await POST(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid request body');
  });
});
