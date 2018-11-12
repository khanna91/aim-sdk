const ConfigurationManager = require('./config');
const Template = require('./template');
const Partner = require('./partner');

class AIM {
  constructor(config) {
    this.config = new ConfigurationManager(config);
  }

  get Template() {
    this.template = new Template(this.config);
    return this.template;
  }

  get Partner() {
    this.partner = new Partner(this.config);
    return this.partner;
  }
}

module.exports = AIM;
