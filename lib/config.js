const _ = require('lodash');

class Configuration {
  constructor(config) {
    // need db url
    this.config = config;
  }

  /**
   * Update the config
   * @param {Object} config
   */
  update(config) {
    this.config = _.assign(this.config, config);
  }

  get config() {
    return this.config;
  }
}

module.exports = Configuration;
