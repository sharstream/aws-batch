'use strict';

const _ = require('lodash');
const AWS = require('aws-sdk');
AWS.config.region = process.env.AWS_REGION_ENV;
const ssm = new AWS.SSM();

/**
 * Restore and retrieve secrets from SSM Parameter Store
 * Another approach is using middy middleware with SecretManager
 */
module.exports = class SecretManager {

    constructor(region) {
        if (!region) {
            this.region = AWS.config.AWS_REGION_ENV;
        }
        else 
            this.region = region, 
            AWS.config.AWS_REGION_ENV = region;

        this.secrets = ['secret_db_username', 'secret_pwd', 'secret_conn_string'];
        this.secretsmanager = new AWS.SecretsManager({
            region: this.region
        });
    }
    
    async _init() {

        return new Promise((resolve, reject) => {
    
            try {
                
                let initialized = false;
            
                if(initialized) return;
            
            
                const params = await getParameters(this.secrets);
            
                process.env.db_username = params.secret_db_username;
                process.env.db_password = params.secret_pwd;
                process.env.conn_string = params.secret_conn_string;
            
                if(!process.env.db_username || process.env.db_password || process.env.conn_string) {
                    throw new Error('All secrets/environments are undefined!')
                }
            
                initialized = true
    
                resolve(initialized);
    
            } catch (error) {

                const typeError = loggedError(error)
                
                reject(new Error(`Message was intercepted as an error type: ${typeError}`));
    
            }
        })
    }

    /**
     * @desc helper connect to SSM thru GetSecretValue permission
     * @param {List<String>} keys 
     */
    async getParameters(keys) {
                    
        const prefix = '/aws/reference/secretsmanager/';

        const request = {
            Names: keys.map( key => `${prefix}${key}`),
            WithDecryption: true
        }

        const response = await ssm.getParameters(request).promise();

        return _.reduce(response.Parameters, (obj, param) => {
            obj[param.Name.substr(prefix.length)] = param.Value;
            return obj;
        }, {})
    }

    /**
     * @desc Calling the createSecret operation
     * @param param list of required properties to seed secret manager obj
     */
    async createSecret(param) {

        return new Promise((resolve, reject) => {
            const params = {
                Name: param.name, //'STRING_VALUE', /* required */
                ClientRequestToken: param.client, //'STRING_VALUE',
                Description: param.description, //'STRING_VALUE',
                KmsKeyId: param.key, //'STRING_VALUE',
                SecretBinary: Buffer.from(param.raw), //|| 'STRING_VALUE' /* Strings will be Base-64 encoded on your behalf */,
                SecretString: param.secretName, //'STRING_VALUE',
                Tags: [
                  {
                    Key: 'default_tag',
                    Value: param.tabValue
                  },
                  /* more items */
                ]
            };
            this.secretsmanager.createSecret(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    reject(err)
                }
                 
                console.log(data); // successful response
                resolve({ secret: data }) // use encryption
            });
        })
    }

    /**
     * @desc getting secret value from Secret Manger Parameter Store
     * SecretString: parameter contains string data
     * SecretBinary: parameter contains binary data
     * @param {String} secret pass a SecretId to retrieve a secret value
     */
    async getSecretValue (secret) {
        return new Promise((resolve, reject) => {

            this.secretsmanager.getSecretValue({ SecretId: secret }, (err, data) => {

                if(err) {
                    const typeError = errorHandler(err);
                    reject(typeError);
                }
                else {
                    if('SecretString' in data) {
                        resolve(JSON.parse(data.SecretString));
                    }
                    else (
                        resolve(Buffer.from(data.SecretBinary, 'utf-8'))
                    )
                }
            })
        })
    }

    errorHandler(err) {

        let error = '';

        if (err) {
            if (err.code === 'DecryptionFailureException')
                // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
                // Deal with the exception here, and/or rethrow at your discretion.
                error = err.code;
            else if (err.code === 'InternalServiceErrorException')
                // An error occurred on the server side.
                // Deal with the exception here, and/or rethrow at your discretion.
                error = err.code;
            else if (err.code === 'InvalidParameterException')
                // You provided an invalid value for a parameter.
                // Deal with the exception here, and/or rethrow at your discretion.
                error = err.code;
            else if (err.code === 'InvalidRequestException')
                // You provided a parameter value that is not valid for the current state of the resource.
                // Deal with the exception here, and/or rethrow at your discretion.
                error = err.code;
            else if (err.code === 'ResourceNotFoundException')
                // We can't find the resource that you asked for.
                // Deal with the exception here, and/or rethrow at your discretion.
                error = err.code;
        }

        return {
            success: 'false',
            message: error
        }
    }
}