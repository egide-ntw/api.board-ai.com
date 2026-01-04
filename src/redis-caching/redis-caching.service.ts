import {
  Injectable,
  OnModuleDestroy,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createHash } from 'crypto';

export interface CacheConfig {
  ttl?: number;
  prefix?: string;
}

@Injectable()
export class RedisCachingService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisCachingService.name);
  private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly DEFAULT_PREFIX = 'cache:';

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn('REDIS_URL is not configured. Redis caching is disabled.');
      return;
    }

    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    this.setupRedisErrorHandling();
  }

  private setupRedisErrorHandling(): void {
    if (!this.redis) return;
    
    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Successfully connected to Redis');
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis client is ready');
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.logger.warn('Reconnecting to Redis...');
    });
  }

  async onModuleDestroy() {
    if (!this.redis) return;
    
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed gracefully');
    } catch (error) {
      this.logger.error('Error while closing Redis connection:', error);
    }
  }

  /**
   * Generates a unique cache key for the given content
   */
  public generateCacheKey(prefix: string, content: string | object): string {
    const contentString =
      typeof content === 'string' ? content : JSON.stringify(content);
    const hash = createHash('sha256')
      .update(contentString.trim())
      .digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Gets a value from cache
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const cached = await this.redis.get(key);
      if (!cached) {
        return null;
      }
      return JSON.parse(cached) as T;
    } catch (error) {
      this.logger.error(`Error retrieving from cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Sets a value in cache with optional TTL
   */
  public async set<T>(
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Deletes a value from cache
   */
  public async delete(key: string): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Gets multiple values from cache
   */
  public async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.redis) return keys.map(() => null);
    
    try {
      const values = await this.redis.mget(keys);
      return values.map((value) => (value ? JSON.parse(value) : null));
    } catch (error) {
      this.logger.error('Error retrieving multiple keys from cache:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Sets multiple values in cache
   */
  public async mset<T>(
    entries: { key: string; value: T; ttl?: number }[],
  ): Promise<boolean> {
    if (!this.redis) return false;
    
    const pipeline = this.redis.pipeline();

    try {
      entries.forEach(({ key, value, ttl }) => {
        pipeline.set(key, JSON.stringify(value), 'EX', ttl || this.DEFAULT_TTL);
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      this.logger.error('Error setting multiple keys in cache:', error);
      return false;
    }
  }

  /**
   * Gets a value from cache or computes it if not present
   */
  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    if (!this.redis) return await fetchFn();
    
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const value = await fetchFn();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}:`, error);
      throw new InternalServerErrorException('Failed to fetch or cache data');
    }
  }

  /**
   * Checks if a key exists in cache
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Gets the TTL of a key in seconds
   */
  public async getTtl(key: string): Promise<number> {
    if (!this.redis) return -1;
    
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Updates the TTL of an existing key
   */
  public async updateTtl(key: string, ttl: number): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error updating TTL for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clears all keys with a specific prefix
   */
  public async clearPrefix(prefix: string): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      const keys = await this.redis.keys(`${prefix}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error clearing keys with prefix ${prefix}:`, error);
      return false;
    }
  }

  /**
   * Gets the Redis client instance for advanced operations
   */
  public getClient(): Redis | null {
    return this.redis || null;
  }
}
