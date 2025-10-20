import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: process.env.ANALYZE_OPEN === 'true',
});

export default withBundleAnalyzer;
