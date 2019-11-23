const AWS = require('aws-sdk');

const parameterCache = new Map();

/**
 * Get secrets from process.env and decrypt them with KMS
 * @param {String} parameterName - the name of the environment variable to fetch & decrypt
 * @param {Boolean} decrypt - automatically decrypt secure strings
 * @returns {Promise} a promise resolving to the decrypted environment variable
 */
function getParameter(parameterName, decrypt = true) {
  const ssm = new AWS.SSM(
    {region: process.env.AWS_REGION && process.env.AWS_REGION !== 'undefined' ? process.env.AWS_REGION : 'us-east-1'});

  if (parameterCache.has(parameterName)) {
    return Promise.resolve(parameterCache.get(parameterName));
  }
  return ssm.getParameter({
    Name: `/${process.env.SERVICE_NAME}/${process.env.STAGE}/${parameterName}`,
    WithDecryption: decrypt,
  }).promise()
    .then(({Parameter: {Value}}) => {
      parameterCache.set(parameterName, Value);
      return Value;
    });
}

module.exports = {getParameter};