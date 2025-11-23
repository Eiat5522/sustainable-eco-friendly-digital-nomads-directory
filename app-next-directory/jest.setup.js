// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Set up global fetch mock
global.fetch = jest.fn()

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'),
  useReducedMotion: () => false,
}))
