'use strict';

const http = require('http')
    , { platform } = require('os')
    , osType = platform()
// The path to the .bat files
    , batches = require('path').resolve(__dirname)
// On Windows Only ...
    , { exec } = require('child_process');

const port = process.env.PORT || 8080
    , MAX_CHILDREN = 3
    , argsArray = [`${batches}/install.bat`, `${batches}/test.bat`, `${batches}/reset.bat`];

const run = async (cmd, argsArray) => {
    // exec all scripts spaces/separated by each .bat filename:
    const spawn = require('child_process').spawn;
    const children = spawn(cmd, [
    '-o', `${batches}/install.bat`,
    '-o', `${batches}/test.bat`,
    '-o', `${batches}/reset.bat`
    ], { shell: true });//convert from stream to buffer);
    // or: need to set some timeout between each .bat file
    // use spawn to retreive huge binary data to Node and avoid Buffer Error: maxBuffer exceeded

    return new Promise(async (resolve, reject) => {

        let buffer = Buffer.from(); //initialize buffer
        let resps = children.map(child => {
            return new Promise((resolve, reject) => {
                child.on('exit', function(code){
                    if (code === 0) resolve(true)
                    reject(false)
                })
            })
        })

        resps = await Promise.all(resps)

        if (resps.filter(Boolean).length === MAX_CHILDREN ) {
            console.log(`success!`)
        } else console.log(`failures.`)

        await delay(500);
    })
}

const server = http.createServer( async (req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'});
    //execute .bat in async way
    const success = await run('start');
    let msg = 'batch success: ' + success;

    res.end(msg + '\\n'); console.log(msg);

}).listen(port, `127.0.0.1`);
console.log(`Server running at http://127.0.0.1:${port}/`);
