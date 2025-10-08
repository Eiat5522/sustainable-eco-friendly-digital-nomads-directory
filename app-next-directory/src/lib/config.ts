function getIntFromEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return defaultValue;
}

export const config = {
  redis: {
    get featuredListingsTTL() { return getIntFromEnv('REDIS_FEATURED_LISTINGS_TTL', 604800); }, // 1 week
    get searchTTL() { return getIntFromEnv('REDIS_SEARCH_TTL', 3600); }, // 1 hour
    get dashboardTTL() { return getIntFromEnv('REDIS_DASHBOARD_TTL', 900); }, // 15 minutes
  },
};