// spawn a child process and execute shell command

'use strict';

const http = require('http')
    , util = require('util')
    , delay = util.promisify(setTimeout)
    , { platform } = require('os')
    , osType = platform()
// The path to the .bat files
    , path = require('path').resolve(__dirname)
// On Windows Only ...
    , { exec } = require('child_process');

const port = process.env.PORT || 8080
    , MAX_CHILDREN = 3
    , args = [`${path}/batches/install.bat`, `${path}/batches/test.bat`, `${path}/batches/reset.bat`];

const run = async (cmd, argsArray) => {
    // exec all scripts spaces/separated by each .bat filename:
    const spawn = require('child_process').spawn;
    const excluded = spawn(cmd, [
    '-o', `${path}/batches/install.bat`,
    '-o', `${path}/batches/test.bat`,
    '-o', `${path}/batches/reset.bat`
    ], { shell: true });//convert from stream to buffer);
    // use spawn to retreive huge binary data to Node and avoid Buffer Error: maxBuffer exceeded
    
    return new Promise(async (resolve, reject) => {
        
        //initialize stream batch
        process.stdout.write(`Sending ${MAX_CHILDREN} requests...`)
        // console.log(`${path}/batches/install.bat`)
        let children = []

        argsArray.forEach(child => {
            children.push(spawn(cmd, [child], { shell: true }))
        })

        let resps = children.map(child => {
            return new Promise((resolve, reject) => {
                child.on('exit', function(code){
                    try { 
                        if (code === 0) resolve(true)
                    } catch (error) {
                        let err = new Error(`command ${cmd} exited with wrong status code ${code} and error message: ${error.message}`);
                        reject(err)
                    }
                }) 
            })
        })
        
        resps = await Promise.all(resps)
        
        if (resps.filter(Boolean).length === MAX_CHILDREN ) {
            console.log(`success!`)
            resolve({ success: resps })
        } else {
            console.log(`failures.`)
            reject({ error: 'failures' })
        }
        
        // or: need to set some timeout between each .bat file
        await delay(500);
    })
}

const server = http.createServer( async (req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'});
    //execute .bat in async way
    let success = osType !== 'win32' ? await run('bash', args) : new Error(`shell command is not compatible \n`);
    let msg = 'batch success: ' + success;

    res.end(msg + '\\n'); console.log(msg);

}).listen(port, `127.0.0.1`);
console.log(`Server running at http://127.0.0.1:${port}/`);
