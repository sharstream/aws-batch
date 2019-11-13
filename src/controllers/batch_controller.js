'use strict';

const util = require('util')
    , delay = util.promisify(setTimeout)
    , { platform } = require('os')
    , osType = platform()
// The path to the .bat files
    , path = require('path').resolve(__dirname)
// On Windows Only ...
    , { exec } = require('child_process')

const MAX_CHILDREN = 3
    , args = [`${path}/batches/install.bat`, `${path}/batches/test.bat`, `${path}/batches/reset.bat`];

// set default batchJob status globally
global.batchStatus = global.batchStatus !== undefined ? global.batchStatus : 'None';

module.exports = { _run, getStatus, startTest, savedJSON }

const getStatus = () => {
    return new Promise((resolve, reject) => {
        const responseObj = {
            jobId: `batch-${global.uuid}`,
        }

        responseObj.message = `Current batch job status: ${global.batchStatus}`;
        responseObj.status = global.batchStatus;

        resolve(responseObj);
    });
}

const startTest = options => {
    // exec all scripts spaces/separated by each .bat filename:
    // On window only ...
    global.batchStatus = 'In Progress';

    // use spawn to retrieve huge binary data to Node and avoid Buffer Error: maxBuffer exceeded

    // initialize stream batch

    try {
        
        if (options.args.length === 0) {
            global.batchStatus = 'Failed';
        } else {
            console.log(`batches submitted: ${options.args}`);

            // executes multiple command by any flow control
            multipleBatches(options.args, err => {
                console.log(`executed many commands in a row`);
                global.batchStatus = 'Done';
            })
        }
    } catch (error) {
        global.batchStatus = 'Failed';
        console.log(error.stack);
    }
}

const multipleBatches = (children, cb) => {
    const execNext = () => {
        exec(children.shift(), err => {
            if(err) cb(err)
            else {
                if(children.length) execNext();
                else cb(null)
            }
        })
    };

    execNext();
}

const exec = (arg, cb) => {
    const child_process = require('child_process');
    const childProc = child_process.spawn(arg);

    let childObj = { lines: [] };

    childProc.stdout.on('data', chunk => {
        childObj.lines.push(chunk.toString());
    })

    childProc.on('exit', code => {
        let err = null;
        if(code) {
            err = new Error(`command ${arg} exited with wrong status code`)
            err.code = code;
            err.cmd = arg;
        }

        if(cb) cb(err);
    })
}

const _run = async (cmd, argsArray) => {
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
                        console.log(JSON.stringify(child))
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