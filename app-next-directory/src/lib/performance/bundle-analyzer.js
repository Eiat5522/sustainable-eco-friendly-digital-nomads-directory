/**
 * Bundle Analyzer Configuration for Next.js
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: process.env.ANALYZE_OPEN === 'true',
})

module.exports = withBundleAnalyzer;
