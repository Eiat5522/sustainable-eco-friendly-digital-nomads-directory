import { jest } from '@jest/globals';
import type { Adapter } from 'next-auth/adapters';

// Mock MongoDB adapter for NextAuth
const mockAdapter: Adapter = {
  createUser: jest.fn<Adapter['createUser']>(),
  getUser: jest.fn<Adapter['getUser']>(),
  getUserByEmail: jest.fn<Adapter['getUserByEmail']>(),
  getUserByAccount: jest.fn<Adapter['getUserByAccount']>(),
  updateUser: jest.fn<Adapter['updateUser']>(),
  deleteUser: jest.fn<Adapter['deleteUser']>(),
  linkAccount: jest.fn<Adapter['linkAccount']>(),
  unlinkAccount: jest.fn<Adapter['unlinkAccount']>(),
  createSession: jest.fn<Adapter['createSession']>(),
  getSessionAndUser: jest.fn<Adapter['getSessionAndUser']>(),
  updateSession: jest.fn<Adapter['updateSession']>(),
  deleteSession: jest.fn<Adapter['deleteSession']>(),
  createVerificationToken: jest.fn<Adapter['createVerificationToken']>(),
  useVerificationToken: jest.fn<Adapter['useVerificationToken']>(),
};

export const createAuthAdapter = jest.fn(() => mockAdapter);
