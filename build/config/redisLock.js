"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.releaseLock = exports.acquireLock = void 0;
const config_1 = require("./config");
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(config_1.SERVER.RURL);
exports.redis = redis;
/**
 * Acquire a lock in Redis.
 * If the lock is already in use, wait and try again
 */
const acquireLock = (key, timeout, retryInterval) => __awaiter(void 0, void 0, void 0, function* () {
    const lock = yield redis.set(key, "LOCKED", "PX", timeout, "NX");
    if (lock)
        return true; // adquired Block...
    //wait before re try...
    yield new Promise((resolve) => setTimeout(resolve, retryInterval));
    return acquireLock(key, timeout, retryInterval);
});
exports.acquireLock = acquireLock;
/**
 * releases a block in redis...
 */
const releaseLock = (key) => __awaiter(void 0, void 0, void 0, function* () {
    yield redis.del(key);
});
exports.releaseLock = releaseLock;
