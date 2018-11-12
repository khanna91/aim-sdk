/* eslint-disable arrow-body-style */
require('dotenv-safe').config();
const { expect } = require('chai');
const { Template } = require('./template.sdk');

let TemplateFetcher;
before(() => {
  TemplateFetcher = new Template({
    awsRegion: 'ap-southeast-1',
    awsKey: process.env.awsKey,
    awsSecret: process.env.awsSecret,
    folderName: 'templates-dev'
  });
});

describe('TemplateFetcher', () => {
  const MISSINGPARAM = 'MissingParam';
  // const MISSINGCONFIG = 'MISSINGCONFIG';

  it('should fetch the raw template', async () => {
    const template = await TemplateFetcher.raw({
      entity: 'partner',
      entityId: 'partnerastro',
      language: 'en',
      category: 'email',
      type: 'registration'
    });
    expect(template).to.be.an('object');
    expect(template).to.have.property('body');
    expect(template).to.have.property('subject');
  });

  it('should fetch the raw template with null subject', async () => {
    const template = await TemplateFetcher.raw({
      entity: 'partner',
      entityId: 'partnerastro',
      language: 'fr',
      category: 'email',
      type: 'registration'
    });
    expect(template).to.be.an('object');
    expect(template).to.have.property('body');
    expect(template).to.have.property('subject');
    expect(template.subject).to.be.empty; // eslint-disable-line
  });

  it('should fetch the interpolated template', async () => {
    const template = await TemplateFetcher.interpolate({
      entity: 'partner',
      entityId: 'partnerastro',
      language: 'en',
      category: 'email',
      type: 'registration'
    }, {
      username: 'rahul'
    });
    expect(template).to.be.an('object');
    expect(template).to.have.property('body');
    expect(template).to.have.property('subject');
  });

  it('should throw error for passing invalid parameters for raw', async () => {
    try {
      await TemplateFetcher.raw({
        entityId: 'partnerCode',
        language: 'fr',
        category: 'email',
        type: 'verification'
      });
    } catch (err) {
      expect(err.code).to.eqls(MISSINGPARAM);
    }
  });

  it('should throw error for passing invalid parameters for interpolate', async () => {
    try {
      await TemplateFetcher.interpolate({
        entityId: 'partnerCode',
        language: 'fr',
        category: 'email',
        type: 'verification'
      });
    } catch (err) {
      expect(err.code).to.eqls(MISSINGPARAM);
    }
  });
});
