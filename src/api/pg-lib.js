'use strict';

const Pool = require('pg').Pool;
const SecretManager = require('./secret-lib');
const {getParameter} = require('./ssmParameterStore');
const AWSXRay = AWSXRay.captureAWS(require('aws-xray-sdk'));

const getDb = () => getParameter('db_password')
    .then(password => new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password,
    }));

const query = async (queryObject) => {
    const secretManager = new SecretManager('us-west-2');
    
    return new Promise(async (resolve, reject) => {
        const dbCred = await secretManager.getSecretValue(`/${stage}/pg_dbcred`);

        const config = {
            user: dbCred.pgUser,
            database: 'connectDb',
            password: dbCred.pgPass,
            host: dbCred.connString,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        }

        const pool = new Pool(config)

        pool.on('error', (err, data) => {
            process.exit(-1);
        })

        pool.query(queryObject)
            .then(res => resolve(res))
            .catch(err => reject(err))
    })
}

const xrayedQuery = (queryObject, fId, traceId) => {

    return new Promise((resolve, reject) => {

        let segment = AWSXRay.getSegment();
    
        if(!fId) {
            fId = (subsegment) => {
                subsegment.addMetadata('postgres query')
                subsegment.addNotation('queryObject')
    
                try {     
                    subsegment.close()
                    return resolve(query(queryObject));
                } catch (error) {
                    subsegment.close(err)
                    return reject(err)
                }       
            }

            AWSXRay.captureAsyncFunction('Unknown XRay Function', fId, segment)
        } else if(!traceId) {
            traceId = 'UnknownTraceIdXRay'
            AWSXRay.captureAsyncFunction('Unknown XRay Trace', traceId)
        }

    })
}

const dbMiddleware = () => ({
    before: handler => getDb().then(db => {
        handler.context.db = db;
    }),
    after: handler => {
        handler.context.db.$pool.end();
    },
    onError: handler => {
        handler.context.db.$pool.end();
        throw handler.error;
    },
})

module.exports = { query, xrayedQuery, getDb, dbMiddleware }