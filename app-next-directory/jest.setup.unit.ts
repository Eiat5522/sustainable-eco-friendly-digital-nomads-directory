// Unit-test only setup (no MSW). Keep minimal for speed and stability.
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
// Provide Request/Response/Headers for Next server modules used in unit tests
// eslint-disable-next-line @typescript-eslint/no-var-requires
const crossFetch = require('cross-fetch')
;(global as any).Request = (global as any).Request || crossFetch.Request
;(global as any).Response = (global as any).Response || crossFetch.Response
;(global as any).Headers = (global as any).Headers || crossFetch.Headers

// eslint-disable-next-line @typescript-eslint/no-var-requires
const React = require('react')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { act } = require('react-dom/test-utils')
;(global as any).IS_REACT_ACT_ENVIRONMENT = true
if (typeof React.act !== 'function') React.act = act
if (!(global as any).requestAnimationFrame) {
  ;(global as any).requestAnimationFrame = (cb: any) => setTimeout(() => cb(Date.now()), 16)
}
if (!(global as any).cancelAnimationFrame) {
  ;(global as any).cancelAnimationFrame = (id: any) => clearTimeout(id)
}
if (!(global as any).TextEncoder) (global as any).TextEncoder = TextEncoder as any
if (!(global as any).TextDecoder) (global as any).TextDecoder = TextDecoder as any
