'use strict'

const request = require('request-promise')

/**
 * @desc get isoline params transform to recieve through api gateway
 * @param {Object} query pass request query paramters to parse to api gateway
 * @return {Object} return another object with the expected output 
 */
const getIsolineMode = (query) => {

    // testing
    // const query = {
    //     "car": "",
    //     "mode": "fastest",
    //     "range": "1800",
    //     "rangetype": "time",
    //     "start": "geo!33.83752,-84.3757399",
    //     "traffic:enabled": ""
    // }
    
    const arr = Object.entries(query)
    let setMode = "";
    for (const [mode, value] of arr) {
        value === '' ? console.log(`value of ${mode} is ${value} empty`) : console.log(`value isn't empty`)
        value === ''  ? setMode = setMode.concat(',', mode) : 'Hello'
    }
    const isolineObj = Object.keys(query).reduce((obj, key) => {
        
        //TODO aggregate all empty attributes to setMode var and return a new property: mode
        let aggMode;
        if(key === "mode") {
            aggMode = query[key]
            aggMode = aggMode.concat('', setMode)
        }

        key === "mode" ? 
        obj[key] = aggMode : query[key] !== '' ? 
        obj[key] = query[key] : 
        null

        return obj
    }, {})
    
    console.log(isolineObj)
    return isolineObj
}

/**
 * @desc submit batch of json files to s3 object storage
 * @param {Array<JSON>} files files saved from s3 object storage
 * @param {String} action GET, POST or POST
 */
const sendData = async (files, action) => {
    try {

        // TODO needs to pass credentials encrypted and auth middleware
        const respBody = {
            'owner': {
                'email': 'test@domain.com'
            },
            'name': 'Synthetic Tests',
            'frecuency': 60,
            'testSteps': files
        }

        const options = {
            uri: 'https://kaiju.data.sfdc.net/synthetics/api/testcases',
            headers: {
                'Content-Type': 'application/json'
            },
            method: action,
            body: respBody,
            timeout: 5000,
            json: true
        }

        const response = await request(options);
        
        return response;
    } catch (error) {
        throw error;//decide if the error is ignored or stops batch processing
    }
}

module.exports = { getIsolineMode, sendData }