'use strict';

const _ = require('lodash');
const AWS = require('aws-sdk');
AWS.config.region = process.env.AWS_REGION_ENV;
const ssm = new AWS.SSM();

module.export = { _init }

/**
 * Restore and retrieve secrets from SSM Parameter Store
 */
const _init = async () => {

    return new Promise((resolve, reject) => {

        try {
            
            let initialized = false;
        
            if(initialized) return;
        
            const getParameters = async keys => {
                
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
        
            const secrets = ['secret_db_username', 'secret_pwd', 'secret_conn_string'];
        
            const params = await getParameters(secrets);
        
            process.env.db_username = params.secret_db_username;
            process.env.db_password = params.secret_pwd;
            process.env.conn_string = params.secret_conn_string;
        
            if(!process.env.db_username || process.env.db_password || process.env.conn_string) {
                throw new Error('All secrets/environments are undefined!')
            }
        
            initialized = true

            resolve(initialized);

        } catch (error) {
            
            reject(new Error(`Message was intercepted as: ${error.stack}`));

        }
    })
}