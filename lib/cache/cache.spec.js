/* eslint-disable arrow-body-style */
const { expect } = require('chai');
const CacheSdk = require('./cache.sdk');

let cache;
before(() => {
  cache = new CacheSdk({
    cacheHost: '127.0.0.1',
    cachePort: 6379
  });
  cache.run();
});

describe('SDK - cache', () => {
  it('should store the data in cache', (done) => {
    cache.put('test', '123').then((result) => {
      if (result) {
        cache.get('test').then((cachedData) => {
          expect(cachedData).to.be.eql('123');
          cache.destroy('test');
          cache.get('test').then((cachedResult) => {
            expect(cachedResult).to.be.undefined; // eslint-disable-line
          });
          done();
        });
      }
    });
  });

  it('should retrieve and remove the data in cache', (done) => {
    cache.put('test', '123').then((result) => {
      if (result) {
        cache.has('test').then((isCacheExist) => {
          if (isCacheExist) {
            cache.pop('test').then((cachedData) => {
              expect(cachedData).to.be.eql('123');
              cache.has('test').then((isCacheStillExist) => {
                if (!isCacheStillExist) {
                  done();
                }
              });
            });
          }
        });
      }
    });
  });

  it('should run the callback and then store the result in cache', async () => {
    const value = await cache.remember('tempNew', 20, () => ('This is a callback value'));
    expect(value).to.be.equal('This is a callback value');
    const keyExists = await cache.has('tempNew');
    expect(keyExists).to.be.true; // eslint-disable-line
    cache.destroy('tempNew');
  });

  it('should run the callback (promise) and then store the result in cache', async () => {
    const value = await cache.remember('tempPromise', 20, () => {
      return new Promise((resolve) => {
        resolve('This is a promise return');
      });
    });
    expect(value).to.be.equal('This is a promise return');
    const keyExists = await cache.has('tempPromise');
    expect(keyExists).to.be.true; // eslint-disable-line
    cache.destroy('tempPromise');
  });

  it('should not store value in cache if callback fails', async () => {
    const value = await cache.remember('tempPromiseFail', 20, () => {
      return new Promise((resolve, reject) => {
        reject();
      });
    });
    expect(value).to.be.undefined; // eslint-disable-line
    const keyExists = await cache.has('tempPromiseFail');
    expect(keyExists).to.be.false; // eslint-disable-line
    cache.destroy('tempPromiseFail');
  });

  it('should store multivalue (object) in cache', async () => {
    const value = await cache.multiput('tempSet', {
      tempKey1: 'This is key 1',
      tempKey2: 'This is key 2',
      tempKey3: 'This is key 3'
    }, 10);
    expect(value).to.be.true; // eslint-disable-line
  });

  it('should return multivalue keys from cache', async () => {
    const [tempKey1, tempKey2] = await cache.multiget('tempSet', ['tempKey1', 'tempKey2']);
    expect(tempKey1).to.be.equal('This is key 1');
    expect(tempKey2).to.be.equal('This is key 2');
    cache.destroy('tempSet');
  });
});
