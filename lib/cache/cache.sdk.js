const Redis = require('ioredis');
const _ = require('lodash');

const configuration = {
  cachePort: 6379,
  cacheHost: '127.0.0.1',
  cachePassword: undefined,
  cacheCluster: 0
};

/**
 * This function is validating the key for checking undefined and null values
 * @param {String} key The cache key which needs to be validated
 *
 * @private
 */
const validateKey = (key) => {
  if (_.isNil(key) || !_.isString(key)) {
    return false;
  }
  return true;
};

class Cache {
  constructor(config = {}) {
    // Check for user configuration first then env variables
    const cacheHost = config.cacheHost || process.env.cacheHost;
    const cachePort = config.cachePort || process.env.cachePort;
    const cachePassword = config.cachePassword || process.env.cachePassword;
    const cacheCluster = config.cacheCluster || process.env.cacheCluster;

    this.configuration = Object.assign(configuration, {
      cacheHost, cachePort, cachePassword, cacheCluster
    });
  }

  run() {
    if (this.configuration.cacheCluster && Number(this.configuration.cacheCluster) === 1) {
      // means cluster needs to be setup
      const clusterNodes = [];
      clusterNodes.push({ host: configuration.cacheHost, port: configuration.cachePort });
      clusterNodes.push({ host: configuration.cacheHost, port: configuration.cachePort });
      this.redisClient = new Redis.Cluster(
        clusterNodes,
        {
          scaleReads: 'slave',
          enableOfflineQueue: true,
          redisOptions: {
            showFriendlyErrorStack: true
          }
        }
      );
    } else {
      // normal redis setup
      this.redisClient = new Redis({
        port: configuration.cachePort,
        host: configuration.cacheHost,
        showFriendlyErrorStack: true
      });
    }

    if (configuration.cachePassword) {
      this.redisClient.auth(process.env.cachePassword);
    }

    this.handleDefaultEvents();
  }

  handleDefaultEvents() {
    // events/error handling
    this.redisClient.on('error', (error) => {
      console.log(`Redis throws error ${error}`);
    });

    this.redisClient.on('connect', () => {
      console.log('Redis has connected');
    });

    this.redisClient.on('reconnecting', () => {
      console.log('Redis has lost connection, it is trying to reconnect');
    });

    this.redisClient.on('ready', () => {
      console.log('Redis is ready to work hard!');
    });
  }

  get _client() {
    return this.redisClient;
  }

  /**
   * This function is used to retrive the value from cache
   * @param {String} key  The key which values needs to retrieve from cache store
   *
   * @public
   */
  async get(key) {
    try {
      if (!validateKey(key)) {
        return undefined;
      }
      const result = await this.redisClient.get(key);
      if (_.isNil(result)) {
        return undefined;
      }
      return JSON.parse(result);
    } catch (err) {
      return undefined;
    }
  }

  /**
   * This function is used to retrive the value from cache, but if its not present,
   * it will set the default value in cache and return
   * default value can also be a callback
   * @param {String} key        The cache key which needs to retrieve from cache store
   * @param {Number} expiry     ttl of the cache key
   * @param {Any} defaultValue  if cache doesn't exist, what needs to be stored in cache key, it accepts value or a callback function
   */
  async remember(key, expiry, defaultValue) {
    try {
      if (!validateKey(key)) {
        return null;
      }
      const result = await this.get(key);
      if (_.isNil(result)) {
        throw new Error('Not in cache');
      }
      return result;
    } catch (err) {
      let result;
      if (!_.isNil(defaultValue)) {
        if (_.isFunction(defaultValue)) {
          try {
            result = await defaultValue();
          } catch (error) {
            result = undefined;
          }
        } else {
          result = defaultValue;
        }
        if (!_.isNil(expiry) && !_.isNil(result)) {
          this.put(key, result, expiry);
        }
      }
      return result;
    }
  }

  /**
   * This function is used to store value in the cache till expiry
   * @param {String} key      The key against which value needs to be stored
   * @param {Any} value       The actual result which will be stored in cache
   * @param {Number} expiry   Seconds for how long the cache will be stored
   */
  async put(key, value, expiry) {
    try {
      if (!validateKey(key)) {
        return false;
      }
      if (!_.isNil(expiry)) {
        await this.redisClient.set(key, JSON.stringify(value), 'ex', expiry);
      } else {
        await this.redisClient.set(key, JSON.stringify(value));
      }

      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * This function is used to remove the key from cache
   * @param {String} key  The key which needs to be evicted from the cache store
   */
  destroy(key) {
    this.redisClient.del(key);
  }

  /**
   * This function is used to check the existence of key in cache
   * @param {String} key  The key which needs to be checked if available or not
   */
  async has(key) {
    try {
      const exists = await this.redisClient.exists(key);
      if (exists) {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * This function is used to retrive the value from cache and afterwards, remove it
   * @param {String} key  The key whose value needs to be retreive and later clear from cache
   */
  async pop(key) {
    try {
      const result = await this.get(key);
      if (!_.isNil(result)) {
        this.destroy(key);
      }
      return result;
    } catch (err) {
      return undefined;
    }
  }

  /**
   * This function is used to retrieves the values associated
   * with the specified fields in the hash stored at key
   * @param {String} key            The name of the set
   * @param {Array<String>} fields  The name of the fields which needs to be retreived from set
   */
  async multiget(key, fields) {
    try {
      if (!validateKey(key)) {
        return {};
      }
      const result = await this.redisClient.hmget(key, fields);
      return result;
    } catch (err) {
      return undefined;
    }
  }

  /**
   * This function is used to store specified fields to their
   * respective values in the hash stored at key
   * @param {String} key      The name of the set
   * @param {Object} data     The object which needs to be stored
   * @param {Number} expiry   ttl in seconds for the cache key, if not present the key will store permanently
   */
  async multiput(key, data, expiry) {
    try {
      if (!validateKey(key)) {
        return false;
      }
      await this.redisClient.hmset(key, data);
      if (expiry) {
        this.redisClient.expire(key, expiry);
      }
      return true;
    } catch (err) {
      return false;
    }
  }
}

module.exports = Cache;
