// Minimal, robust setup for unit tests only (no MSW here)
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Prefer CJS require to patch module exports (works under Jest transform)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const React = require('react')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { act } = require('react-dom/test-utils')

// React 19: signal act environment and ensure React.act exists
;(global as any).IS_REACT_ACT_ENVIRONMENT = true
if (typeof React.act !== 'function') {
  React.act = act
}

// Stable requestAnimationFrame for components using RAF
if (!(global as any).requestAnimationFrame) {
  ;(global as any).requestAnimationFrame = (cb: any) => setTimeout(() => cb(Date.now()), 16)
}
if (!(global as any).cancelAnimationFrame) {
  ;(global as any).cancelAnimationFrame = (id: any) => clearTimeout(id)
}

// Basic polyfills sometimes required in Jest
if (!(global as any).TextEncoder) (global as any).TextEncoder = TextEncoder as any
if (!(global as any).TextDecoder) (global as any).TextDecoder = TextDecoder as any
