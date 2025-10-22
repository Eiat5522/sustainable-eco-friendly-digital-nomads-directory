import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'
import React from 'react'

// These mocks are hoisted and will apply to all imports
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@/utils/theme', () => ({
  __esModule: true,
  normalizeTheme: jest.fn(),
  themeClass: jest.fn(),
  THEME_INIT_SCRIPT: 'console.log("theme-init-script");',
}))

jest.mock('./ClientRootLayout', () => ({
  __esModule: true,
  default: jest.fn(({ children, theme }) => (
    <div data-testid="client-root-layout" data-theme={theme}>
      {children}
    </div>
  )),
}))

describe('RootLayout', () => {
  beforeEach(() => {
    // Clear mock history and reset module cache before each test
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should render with light theme when cookie is not set', async () => {
    // Arrange: Set up mocks for this specific test case
    const mockedCookies = (await import('next/headers')).cookies as jest.Mock
    const { normalizeTheme, themeClass } = await import('@/utils/theme')

    mockedCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    })
    ;(normalizeTheme as jest.Mock).mockReturnValue('light')
    ;(themeClass as jest.Mock).mockReturnValue('')

    // Act: Dynamically import the component to ensure it gets the mocked dependencies
    const { default: RootLayoutComponent } = await import('./layout')
    const Layout = await RootLayoutComponent({ children: <div>Child Content</div> })
    render(Layout)

    // Assert
    expect(mockedCookies).toHaveBeenCalled()
    expect(normalizeTheme).toHaveBeenCalledWith(undefined)
    expect(themeClass).toHaveBeenCalledWith('light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(screen.getByTestId('client-root-layout')).toHaveAttribute('data-theme', 'light')
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  it('should render with dark theme when cookie is set to "dark"', async () => {
    // Arrange
    const mockedCookies = (await import('next/headers')).cookies as jest.Mock
    const { normalizeTheme, themeClass } = await import('@/utils/theme')

    mockedCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'dark' }),
    })
    ;(normalizeTheme as jest.Mock).mockReturnValue('dark')
    ;(themeClass as jest.Mock).mockReturnValue('dark')

    // Act
    const { default: RootLayoutComponent } = await import('./layout')
    const Layout = await RootLayoutComponent({ children: <div>Child Content</div> })
    render(Layout)

    // Assert
    expect(normalizeTheme).toHaveBeenCalledWith('dark')
    expect(themeClass).toHaveBeenCalledWith('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByTestId('client-root-layout')).toHaveAttribute('data-theme', 'dark')
  })

  it('should include the theme initialization script in the head', async () => {
    // Arrange
    const mockedCookies = (await import('next/headers')).cookies as jest.Mock
    const { normalizeTheme, themeClass, THEME_INIT_SCRIPT } = await import('@/utils/theme')

    mockedCookies.mockResolvedValue({ get: jest.fn().mockReturnValue(undefined) })
    ;(normalizeTheme as jest.Mock).mockReturnValue('light')
    ;(themeClass as jest.Mock).mockReturnValue('')

    // Act
    const { default: RootLayoutComponent } = await import('./layout')
    const Layout = await RootLayoutComponent({ children: <div>Child Content</div> })
    render(Layout)

    // Assert
    const script = document.head.querySelector('script')
    expect(script).not.toBeNull()
    expect(script?.innerHTML).toBe(THEME_INIT_SCRIPT)
  })
})
