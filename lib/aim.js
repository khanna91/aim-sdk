
const Template = require('./template');
const Partner = require('./partner');
const Cache = require('./cache');

const AIM = {
  Template: config => new Template(config),
  Partner: config => new Partner(config),
  Cache: config => new Cache(config)
};

module.exports = AIM;
