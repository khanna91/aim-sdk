const AWS = require('aws-sdk');
const Mustache = require('mustache');

const BucketName = 'identity-template-service';
const MISSINGPARAM = 'MissingParam';
const MISSINGCONFIG = 'MISSINGCONFIG';
const MISSINGFOLDER = 'MISSINGFOLDER';

class TemplateError extends Error {
  /**
   * Constructor function
   *
   * @param {String} message - Error message
   * @param {String} code - Error code
   */
  constructor(message, code) {
    super(message || /* istanbul ignore next: tired of writing tests */ 'Something went wrong');
    this.name = this.constructor.name;
    this.code = code || 'Unknown';
  }
}

exports.TemplateError = TemplateError;

/**
 * Error handling function
 * @param {Any} err   error object
 */
const handleError = (err) => {
  if (err instanceof TemplateError) {
    throw err;
  }
  throw new TemplateError(err.message, err.code);
};

exports.handleError = handleError;

/**
 * Validator function to check for required
 * @param {String} name   Field name which needs to be validated
 * @param {String} value  Field value which will be validated
 * @param {String} code   Error code, if validation fails
 */
const checkForRequired = (name, value, code = MISSINGPARAM) => {
  if (!value) {
    throw new TemplateError(`Invalid parameter - Missing ${name}`, code);
  }
};

/**
 * Function to validate the parameters
 * @param {Object} props  contains the information about template
 */
const validateProps = (props) => {
  checkForRequired('entity', props.entity);
  checkForRequired('entityId', props.entityId);
  checkForRequired('category', props.category);
  checkForRequired('type', props.type);
  checkForRequired('language', props.language);

  return true;
};

class Template {
  constructor(config) {
    checkForRequired('region', config.awsRegion, MISSINGCONFIG);
    checkForRequired('aws key', config.awsKey, MISSINGCONFIG);
    checkForRequired('aws secret', config.awsSecret, MISSINGCONFIG);
    checkForRequired('folder name', config.folderName, MISSINGFOLDER);
    this.folderName = config.folderName;
    this.s3Bucket = new AWS.S3({
      params: { Bucket: BucketName },
      apiVersion: '2012-10-17',
      region: config.awsRegion,
      accessKeyId: config.awsKey,
      secretAccessKey: config.awsSecret
    });
  }

  /**
   * Function to format the final filename
   * @param {Object} props  contains the information about template
   */
  _curateFileLocation(props) {
    return (`${this.folderName}/${props.entity}/${props.entityId}/${props.category}/${props.type}/${props.language}.txt`);
  }


  /**
   * Function to retrieve the template from s3 bucket
   * @param {Object} props  contains the information about template
   */
  async _getTemplate(props) {
    const fileName = this._curateFileLocation(props);
    const data = await this.s3Bucket.getObject({ Key: fileName }).promise();
    let content = data.Body.toString('utf8');
    try {
      content = JSON.parse(content);
      return content;
    } catch (err) {
      return {
        subject: '',
        body: content
      };
    }
  }


  /**
   * Function to fetch the raw template from s3 bucket
   * @param {Object} props  contains the information about template
   */
  async raw(props) {
    try {
      validateProps(props);
      const template = await this._getTemplate(props);

      return template;
    } catch (err) {
      throw handleError(err);
    }
  }

  /**
   * Function to fetch the interpolated template from s3 bucket
   * @param {Object} props  contains the information about template
   * @param {Object} data  contains the data which needs to be replaced
   */
  async interpolate(props, data) {
    try {
      validateProps(props);
      const template = await this._getTemplate(props);
      const subject = Mustache.render(template.subject || '', data);
      const body = Mustache.render(template.body, data);
      return {
        subject,
        body
      };
    } catch (err) {
      throw handleError(err);
    }
  }
}

exports.Template = Template;
