// spawn a child process and execute shell command

'use strict';

const fs = require('fs');

const http = require('http')
    , SecretManager = require('./src/api/secret-lib')
    , { exportJSON }= require('./src/api/utils')
    , { startTest } = require('./src/controllers/batch_controller')
    , { platform } = require('os')
    , osType = platform()
    , path = require('path').resolve(__dirname)
    , args = [`${path}/batches/install.bat`, `${path}/batches/test.bat`, `${path}/batches/reset.bat`];

const api = require('./src/routes/data_server')

const port = process.env.PORT || 8080

function readJsonFileSync(filepath, encoding){

    if (typeof (encoding) == 'undefined'){
        encoding = 'utf8';
    }
    let file = fs.readFileSync(filepath, encoding);
    return JSON.parse(file);
}

// retrieving...secrets manager
const server = http.createServer( async (req, res) => {

    // if(!process.env.db_username || process.env.db_password || process.env.conn_string) {
    //     const secretManager = new SecretManager('us-west-2');
    //     await secretManager._init()
    // }
    console.log(req.method)
    const obj = readJsonFileSync(__dirname + '/__tests__/postman/collection.json');
    obj.filename = 'test_server';
    let response = exportJSON(new Array(obj));
    if(req.method !== 'GET') {
        console.log(JSON.stringify({
            success: false
        }))
    }
    const options = {}
    options.args = args;

    let body;
    res.on('chunk', (err, data) => {
        body += data;
    })
    res.writeHead(200, {'Content-Type': 'application/json'});
    //execute .bat in async way
    let success = osType !== 'win32' ? await startTest(options) : new Error(`shell command is not compatible with the platform`);
    let msg = 'batch success: ' + JSON.stringify(success);
    const resObj = {}
    resObj.msg = msg;
    resObj.data = response;
    res.end(resObj);

})

server.on('error', function (e) {
    // Handle your error here
    console.log(e);
});

server.listen(port, `127.0.0.1`);
console.log(`Server running at http://127.0.0.1:${port}/`);
