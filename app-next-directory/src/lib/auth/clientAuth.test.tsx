/// <reference types="@testing-library/jest-dom" />
import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { useSession, signIn, signOut } from 'next-auth/react';

// Import the components to be tested
import { UserRole, FeaturePermissions } from '../../types/auth';
import {
  AuthProvider,
  useAuthContext,
  Authenticated,
  RequireRole,
  RequirePermission,
  AdminOnly,
} from './clientAuth';

const mockHasFeaturePermission = jest.fn((role: UserRole, feature: keyof FeaturePermissions) => {
  // Default mock implementation if needed, or rely on individual test cases to set return values
  return true;
}) as (role: UserRole, feature: keyof FeaturePermissions) => boolean;