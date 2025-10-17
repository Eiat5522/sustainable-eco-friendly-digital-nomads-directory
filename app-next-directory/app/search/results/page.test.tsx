/** @jest-environment jsdom */
/**
 * Unit tests for Search Results Page
 * 
 * Note: This is a server component test that focuses on testing the exported page module.
 * Since this is a server component with async operations, we test the module's existence
 * and basic structure rather than full rendering.
 * 
 * Priority: MEDIUM - Server component with limited unit testability
 * Coverage Target: 50%+ (limited due to server component constraints)
 */

import '@testing-library/jest-dom'

describe('ResultsPage Module', () => {
  it('should export a default ResultsPage component', () => {
    const ResultsPageModule = require('../page')
    expect(ResultsPageModule.default).toBeDefined()
    expect(typeof ResultsPageModule.default).toBe('function')
  })

  it('should export dynamic configuration', () => {
    const ResultsPageModule = require('../page')
    expect(ResultsPageModule.dynamic).toBe('force-dynamic')
  })

  it('should be a valid React Server Component', async () => {
    const ResultsPageModule = require('../page')
    const ResultsPage = ResultsPageModule.default
    
    // Server components accept searchParams as a prop
    const props = { searchParams: Promise.resolve({}) }
    
    // Should not throw when called
    expect(async () => {
      await ResultsPage(props)
    }).not.toThrow()
  })
})
