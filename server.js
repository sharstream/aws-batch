'use strict';

const app = require('express')()
    , { platform } = require('os')
    , osType = platform()
// The path to the .bat files
    , batches = require('path').resolve(__dirname)
// On Windows Only ...
    , { exec } = require('child_process');

const port = process.env.PORT || 8080;
let argsArray = [`${batches}/install.bat`, `${batches}/test.bat`, `${batches}/reset.bat`]

const run = function(cmd, argsArray) {
    // exec all scripts spaces/separated by each .bat filename:
    const spawn = require('child_process').spawn;
    const children = spawn(cmd, [
    '-o', `${batches}/install.bat`,
    '-o', `${batches}/test.bat`,
    '-o', `${batches}/reset.bat`
    ], { shell: true });//convert from stream to buffer);
    // or: need to set some timeout between each .bat file
    // use spawn to retreive huge binary data to Node and avoid Buffer Error: maxBuffer exceeded

    return new Promise((resolve, reject) => {

        let buffer = Buffer.from(); //initialize buffer
        exec(children, (error, stdout, stderr) => {
            // TODO
            if (error) { return reject(error) }
            return resolve({ stdout, stderr })
        });
    })
}

app.listen(port, () => console.log(`App listening on port ${port}!`))