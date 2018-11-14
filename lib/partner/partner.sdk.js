const axios = require('axios');
const Cache = require('../cache');

/**
 * Function to fetch the partner information from the partner service
 * @param {Array} args
 */
const fetchPartner = async (args) => {
  try {
    const {
      url, clientId, clientSecret
    } = args[0];
    const result = await axios.request({
      method: 'GET',
      url,
      headers: {
        Authorizaton: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      timeout: 10000
    });
    return result.data.response;
  } catch (err) {
    throw err;
  }
};

/**
 * Function to format the list data
 * @param {Array} data
 */
const formatClientResponse = (data) => {
  const result = data.map(partner => ({
    client_id: partner.partnerKey,
    client_secret: partner.partnerSecret,
    grant_types: partner.grantTypes,
    response_types: partner.responseTypes,
    redirect_uris: partner.allowLoginSuccessRedirect
  }));
  return result;
};

/**
 * Validator function to check for required
 * @param {String} name   Field name which needs to be validated
 * @param {String} value  Field value which will be validated
 */
const checkForRequired = (name, value) => {
  if (!value) {
    throw new Error(`Invalid parameter - Missing ${name}`);
  }
};

class Partner {
  constructor(config = {}) {
    checkForRequired('partnerEndpoint', config.partnerEndpoint);
    checkForRequired('partnerClientId', config.partnerClientId);
    checkForRequired('partnerClientSecret', config.partnerClientSecret);
    this.partnerEndpoint = config.partnerEndpoint;
    this.partnerClientId = config.partnerClientId;
    this.partnerClientSecret = config.partnerClientSecret;
    this.cache = new Cache({
      cacheHost: config.cacheHost || '127.0.0.1',
      cachePort: config.cachePort || 6379,
      cacheCluster: config.cacheCluster || 0
    });
    this.cache.run();
  }

  async get(partnerKey, cacheRequired = true) {
    const cacheKey = `partnerInfo:${process.env.NODE_ENV}:${partnerKey}`;
    const opts = {
      url: `${this.partnerEndpoint}/${partnerKey}`,
      clientId: this.partnerClientId,
      clientSecret: this.partnerClientSecret
    };
    let partnerInfo;
    if (cacheRequired) {
      partnerInfo = await this.cache.remember(cacheKey, 30 * 60, fetchPartner, opts);
    } else {
      try {
        partnerInfo = await fetchPartner([opts]);
      } catch (err) {
        console.log('API failure happen while fetching info without cache');
      }
    }
    return partnerInfo;
  }

  async getAll() {
    try {
      const result = await axios.request({
        method: 'GET',
        url: this.partnerEndpoint,
        headers: {
          Authorizaton: `Basic ${Buffer.from(`${this.partnerClientId}:${this.partnerClientSecret}`).toString('base64')}`
        },
        timeout: 10000
      });
      return formatClientResponse(result.data.response);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Partner;
