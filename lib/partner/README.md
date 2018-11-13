# Astro Partner SDK

This sdk will connect with partner service and fetch the details of partner(s)

## Usage
```
const AIM = require('@astro-my/aim-sdk');

// All config mention below are required
Partner = new AIM.Partner({
  partnerEndpoint: 'http://localhost:3000/api/v1',
  cacheHost: '127.0.0.1',
  cachePort: 6379,
  partnerClientId: 'test',
  partnerClientSecret: 'test'
});

const partnerInfo = await Partner.get(partnerKey);

or

const allPartner = await Partner.getAll();
```