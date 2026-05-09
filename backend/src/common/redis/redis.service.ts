import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.client = new Redis(redisUrl);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK' | null> {
    if (ttl) {
      return this.client.set(key, value, 'EX', ttl);
    }
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  async setJson(key: string, value: any, ttl?: number): Promise<'OK' | null> {
    return this.set(key, JSON.stringify(value), ttl);
  }
}
