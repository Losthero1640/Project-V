import { createClient } from "redis";
import { logger } from "./logger.js";

let redisClient = null;
let isRedisConnected = false;

const initRedis = async () => {
  if (process.env.DISABLE_REDIS === "true") {
    logger.warn("Redis is explicitly disabled via env.");
    return;
  }

  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  redisClient = createClient({
    url: redisUrl,
  });

  let hasLoggedError = false;
  redisClient.on("error", (err) => {
    if (!hasLoggedError) {
      logger.warn(`Redis Connection error: ${err.message}. Caching disabled (falling back to database).`);
      hasLoggedError = true;
    }
    isRedisConnected = false;
  });

  redisClient.on("connect", () => {
    logger.info("Redis connecting...");
  });

  redisClient.on("ready", () => {
    logger.info("Redis client connected and ready to cache");
    isRedisConnected = true;
    hasLoggedError = false;
  });

  redisClient.on("end", () => {
    logger.warn("Redis client connection closed");
    isRedisConnected = false;
  });

  try {
    await redisClient.connect();
  } catch (error) {
    logger.error(`Failed to connect to Redis on startup: ${error.message}. Caching is disabled (falling back to database operations).`);
    isRedisConnected = false;
  }
};

// Initialize Redis asynchronously
initRedis();

export const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.warn(`Redis getCache error for key ${key}: ${error.message}`);
    return null;
  }
};

export const setCache = async (key, value, expirySeconds = 300) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    const stringValue = JSON.stringify(value);
    await redisClient.set(key, stringValue, {
      EX: expirySeconds,
    });
    return true;
  } catch (error) {
    logger.warn(`Redis setCache error for key ${key}: ${error.message}`);
    return false;
  }
};

export const delCache = async (key) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.warn(`Redis delCache error for key ${key}: ${error.message}`);
    return false;
  }
};

export const delCachePrefix = async (prefix) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    // Note: KEYS pattern is okay for small scale YouTube clones, but scan is safer.
    // For simplicity, we search keys and delete them.
    const keys = await redisClient.keys(`${prefix}*`);
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.warn(`Redis delCachePrefix error for prefix ${prefix}: ${error.message}`);
    return false;
  }
};
