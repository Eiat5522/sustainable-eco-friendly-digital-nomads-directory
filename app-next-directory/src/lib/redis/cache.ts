import { getRedisClient } from '../redis';

class CacheService {
  private client = getRedisClient();

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) {
      return null;
    }
    return this.client.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.set(key, value, { ex: ttl });
  }

  async del(key: string): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.del(key);
  }
}

export const cacheService = new CacheService();