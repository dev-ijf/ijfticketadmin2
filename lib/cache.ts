import { redis } from "./redis"

export class CacheManager {
  private static instance: CacheManager
  private defaultTTL = 3600 // 1 hour in seconds

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      return value as T
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await redis.setex(key, ttl, JSON.stringify(value))
      } else {
        await redis.setex(key, this.defaultTTL, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
      return false
    }
  }

  async clearPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
        return keys.length
      }
      return 0
    } catch (error) {
      console.error(`Cache clear pattern error for ${pattern}:`, error)
      return 0
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  // Cache keys for different data types
  static keys = {
    events: "events:all",
    event: (id: string | number) => `event:${id}`,
    customers: "customers:all",
    customer: (id: string | number) => `customer:${id}`,
    orders: "orders:all",
    order: (id: string | number) => `order:${id}`,
    tickets: "tickets:all",
    ticket: (id: string | number) => `ticket:${id}`,
    paymentChannels: "payment_channels:all",
    paymentChannel: (id: string | number) => `payment_channel:${id}`,
    notificationTemplates: "notification_templates:all",
    notificationTemplate: (id: string | number) => `notification_template:${id}`,
    dashboardStats: "dashboard:stats",
  }
}

export const cache = CacheManager.getInstance()
