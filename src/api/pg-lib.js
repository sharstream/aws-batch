'use strict';

const Pool = require('pg').Pool;
const SecretManager = require('./secret-lib');

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

module.exports = { query }