/* eslint-disable arrow-body-style */
const { expect } = require('chai');
const PartnerSdk = require('./partner.sdk');

let Partner;
before(() => {
  Partner = new PartnerSdk({
    partnerEndpoint: 'http://localhost:3000/api/v1',
    cacheHost: '127.0.0.1',
    cachePort: 6379,
    partnerClientId: 'test',
    partnerClientSecret: 'test'
  });
});

describe('Test Partner SDK', () => {
  it('should return partner', async () => {
    const result = await Partner.get('unit_test_code');
    expect(result).to.be.an('object');
  });
});

describe('Test Partner SDK', () => {
  it('should return partner', async () => {
    const result = await Partner.getAll();
    expect(result).to.be.an('array');
  });
});
