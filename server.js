// spawn a child process and execute shell command

'use strict';

const http = require('http')
    , SecretManager = require('./src/api/secret-lib')
    , { _run } = require('./src/controllers/batch_controller');

const port = process.env.PORT || 8080

// retrieving...secrets manager
const server = http.createServer( async (req, res) => {

    if(!process.env.db_username || process.env.db_password || process.env.conn_string) {
        const secretManager = new SecretManager('us-west-2');
        await secretManager._init()
    }

    res.writeHead(200, {'Content-Type': 'application/json'});
    //execute .bat in async way
    let success = osType !== 'win32' ? await run('bash', args) : new Error(`shell command is not compatible with the platform`);
    let msg = 'batch success: ' + JSON.stringify(success);

    res.end(msg + '\\n'); console.log(msg);

}).listen(port, `127.0.0.1`);
console.log(`Server running at http://127.0.0.1:${port}/`);
