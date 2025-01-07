import { SERVER } from "./config";
import Redis from "ioredis";

const redis = new Redis(SERVER.RURL);

/**
 * Acquire a lock in Redis.
 * If the lock is already in use, wait and try again
 */
const acquireLock = async (key: string, timeout: number, retryInterval: number): Promise<boolean> => {
    const lock = await redis.set(key, "LOCKED", "PX", timeout, "NX");
    if(lock) return true; // adquired Block...

    //wait before re try...
    await new Promise<void>((resolve) => setTimeout(resolve, retryInterval));
    return acquireLock(key, timeout, retryInterval);
}

/**
 * releases a block in redis...
 */
const releaseLock = async (key: string): Promise<void> => {
    await redis.del(key);
}

export {acquireLock, releaseLock, redis};