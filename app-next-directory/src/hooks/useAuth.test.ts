import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import {
  hasFeaturePermission,
  hasPagePermission,
  type UserRole,
} from '../types/auth'
import { useAuth, useIsAdmin, useRequireRole } from './useAuth'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('../types/auth', () => {
  const actual = jest.requireActual('../types/auth')
  return {
    ...actual,
    hasPagePermission: jest.fn(),
    hasFeaturePermission: jest.fn(),
  }
})

describe('useAuth', () => {
  const useSessionMock = useSession as jest.MockedFunction<typeof useSession>
  const hasPagePermissionMock = hasPagePermission as jest.MockedFunction<typeof hasPagePermission>
  const hasFeaturePermissionMock = hasFeaturePermission as jest.MockedFunction<typeof hasFeaturePermission>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('exposes session details and delegates to permission helpers', () => {
    const user = { name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' as UserRole }
    useSessionMock.mockReturnValue({ data: { user }, status: 'authenticated' })
    hasPagePermissionMock.mockReturnValue(true)
    hasFeaturePermissionMock.mockReturnValue(false)

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toEqual(user)
    expect(result.current.userRole).toBe('admin')

    expect(result.current.hasPagePermission('dashboard', 'view')).toBe(true)
    expect(hasPagePermissionMock).toHaveBeenCalledWith('admin', 'dashboard', 'view')

    expect(result.current.hasFeaturePermission('betaFeature')).toBe(false)
    expect(hasFeaturePermissionMock).toHaveBeenCalledWith('admin', 'betaFeature')
  })

  it('falls back to anonymous defaults when the user is loading or missing', () => {
    useSessionMock.mockReturnValue({ data: null, status: 'loading' })
    hasPagePermissionMock.mockReturnValue(false)
    hasFeaturePermissionMock.mockReturnValue(false)

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeUndefined()
    expect(result.current.userRole).toBe('unidentifiedUser')
    expect(result.current.status).toBe('loading')

    result.current.hasPagePermission('home', 'view')
    expect(hasPagePermissionMock).toHaveBeenCalledWith('unidentifiedUser', 'home', 'view')

    result.current.hasFeaturePermission('anyFeature')
    expect(hasFeaturePermissionMock).toHaveBeenCalledWith('unidentifiedUser', 'anyFeature')
  })

  it('derives additional helpers from the computed role', () => {
    useSessionMock.mockReturnValue({ data: { user: { role: 'superAdmin' as UserRole } }, status: 'authenticated' })

    const { result: requireRoleResult } = renderHook(() => useRequireRole('superAdmin'))
    const { result: isAdminResult } = renderHook(() => useIsAdmin())

    expect(requireRoleResult.current).toBe(true)
    expect(isAdminResult.current).toBe(true)
  })
})
