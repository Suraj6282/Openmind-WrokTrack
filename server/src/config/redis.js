const Redis = require('ioredis');

let redisClient;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redisClient.on('connect', () => {
    console.log('Redis connected');
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });
} else {
  console.warn('Redis URL not provided, running without Redis');
}

// Cache helper functions
const cache = {
  async get(key) {
    if (!redisClient) return null;
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key, value, ttl = 3600) {
    if (!redisClient) return;
    await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
  },

  async del(key) {
    if (!redisClient) return;
    await redisClient.del(key);
  },

  async clear(pattern) {
    if (!redisClient) return;
    const keys = await redisClient.keys(pattern);
    if (keys.length) {
      await redisClient.del(keys);
    }
  }
};

// Rate limiter helper
const rateLimiter = {
  async increment(key, windowMs) {
    if (!redisClient) return { total: 1, remaining: 0 };
    
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, Math.ceil(windowMs / 1000));
    }
    
    const ttl = await redisClient.ttl(key);
    return {
      total: current,
      remaining: ttl
    };
  },

  async getRemaining(key) {
    if (!redisClient) return 0;
    return redisClient.ttl(key);
  },

  async reset(key) {
    if (!redisClient) return;
    await redisClient.del(key);
  }
};

// Session store
let sessionStore;
if (redisClient) {
  const RedisStore = require('connect-redis').default;
  sessionStore = new RedisStore({ client: redisClient });
}

module.exports = {
  redisClient,
  cache,
  rateLimiter,
  sessionStore
};