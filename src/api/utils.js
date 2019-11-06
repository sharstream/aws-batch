const fs = require('fs'),
    dir = __dirname + '/postman/',
    base_url = 'https://test.com',
    uuid = require('uuid/v4');
//define environments var as -> internal.${environment}.sfmapsapi
/* 
  testCaseId, testStepId could be some random numbers
*/
let DEFAULT = 9670;
let testStepId = 20081;

/**
 * @desc Return JSON object from a list of objects
 * @param {Array<Object>} list list of objects
 */
const convertToJSON = list => {
    //convert
    if(list.length === 1)
        return list[0]

    const result = {};
    for (let i = 0; i < list.length; i++) {
        Object.assign(result, list[i])
    }

    return result;
}

/**
 * @desc Return a Function Object to  setVariable from Kaiju
 * @param {Object} beforeStep before step executed
 */
const updateFunctionObject = beforeStep => {

    if(beforeStep.javaScript !== undefined) return beforeStep;
    if(beforeStep.testUrl.indexOf('/guide/submit/2') > -1 ) {
        beforeStep.javaScript = {
            "post": "function executeAfterStep(currentStep, retryIndex) {\n    try {\n        const response = JSON.parse(currentStep.getResponseString());\n        const jobid = response.jobId\n        console.log('<jobid>', jobid)\n        testCase.setVariable('<jobid>', jobid)\n    } catch (error) {\n        console.log(error)\n    }\n}"
        }
    }
    return beforeStep;
}
/**
 * @desc Get and transform the current data from postman into kaiju json format
 * @param {Object} currentStep transform the current step into the kaiju json format
 * @param {Object} currentData current data comming from postman collections 
 */
// InternalError: The choice of Java method com.salesforce.dva.synthetics
// .executor.scripting.TestCaseWrapper.setVariable matching JavaScript argument types 
// (string,org.mozilla.javascript.Undefined)

const getStepPerRequest = (currentStep, currentData) => {
    if (currentData.name === '200 Log in') {
        currentStep.javaScript = {
            "post": "function executeAfterStep(currentStep, retryIndex) {\n    try {\n        const response = JSON.parse(currentStep.getResponseString());\n        const auth_token = 'Bearer ' + response.data.token\n        console.log('<auth_token>', auth_token)\n        testCase.setVariable('<auth_token>', auth_token)\n    } catch (error) {\n        console.log(error)\n    }\n}"
        };
        currentStep.headers = Object.assign(currentStep.headers, {
            "x-api-key": "<secret.x-api-key>"
        });
        currentStep.postContent = currentData.request.body.raw ? currentData.request.body.raw : currentData.request.body;

    } else {
        if (Array.isArray(currentData.request.header)) {
            const newHeader = currentData.request.header.map(propertyName => {

                let obj = {}

                if (propertyName.key === 'Authorization') {
                    const auth = /{{auth_token}}/
                    obj[`${propertyName.key}`] = propertyName.value.replace(auth, '<auth_token>');
                } else if (propertyName.key === 'jobid') {
                    const job = /{{jobid}}/
                    obj[`${propertyName.key}`] = propertyName.value.replace(job, '<jobid>');
                } else {
                    obj[`${propertyName.key}`] = propertyName.value;
                }
                return obj;
            });

            const result = convertToJSON(newHeader)

            currentStep.headers = result;
        }
        if(!!currentData.request.body && Object.hasOwnProperty(currentData.request.body.raw) !== undefined && currentData.request.body.raw !== '') {
            currentStep.postContent = currentData.request.body.raw;
        }
        if (!!currentData.request.url.query) {
            //TODO replacing formParameters from query parameters
            console.log(currentData.request.url.query)
            const newQuery = currentData.request.url.query.map(propertyName => {
                let obj = {}
                if (propertyName.key === 'jobid') {
                    const job = /{{jobid}}/
                    obj[`${propertyName.key}`] = propertyName.value.replace(job, '<jobid>');
                } else {
                    obj[`${propertyName.key}`] = propertyName.value;
                }
                return obj;
            });

            const result = convertToJSON(newQuery)

            currentStep.formParameters = result;
        }
    }
    return currentStep;
}

/**
 * @desc Retrieve and convert to kaiju json format
 * @param {File} files json postman collection files
 */
const exportJSON = files => {

    const result = [];

    files.forEach(file => {
        const newObj = JSON.parse(JSON.stringify(file))

        let testCaseId = DEFAULT++

        try {

            const server = file.filename;
            const regex = /{{base_url}}/gi;
            const kaiju = {
                "owner": {
                    "teamName": "TEST",
                    "ownerId": 334,
                    "email": "test@domain.com"
                },
                "testSteps": [],
                // "testCaseId": testCaseId,
                "name": server,
                "description": "Maps",
                "testCaseEnabled": true,
                "prometheusEnabled": false,
                "frequency": 300,
                "timeout": 60,
                "dependentTestSteps": false,
                "agents": [{
                    "owner": {
                        "teamName": "Kaiju All Teams",
                        "ownerId": 163,
                        "email": "kaiju-admins@salesforce.com"
                    },
                    "agentId": 45,
                    "agentName": "Virgina Sandbox Agent",
                    "agentType": "heroku-vir",
                    "location": "VIR",
                    "agentApiEndpoint": "https://kaiju-sandbox.data.sfdc.net/synthetics/api/agents",
                    "agentEnabled": true,
                    "distributeRuns": false,
                    "shared": true,
                    "createdTime": new Date().getTime(),
                    "updatedTime": new Date().getTime()
                }],
                "statefulHttpClient": true,
                "createdTime": new Date().getTime(),
                "updatedTime": new Date().getTime(),
                "distributeReplaceableRuns": false,
                "adHocEnabled": false,
                "secret": {
                    "secretId": 122,
                    "owner": {
                        "teamName": "MAPI",
                        "ownerId": 334,
                        "email": "test@domain.com"
                    },
                    "name": "Authentication",
                    "description": "authorize api",
                    "type": "UI",
                    "secretKeys": ["x-api-key"],
                    "createdTime": new Date().getTime(),
                    "updatedTime": new Date().getTime()
                },
                "updatedDateTime": "2019-11-04T19:56:13.126Z",
                "createdDateTime": "2019-11-04T15:52:34.668Z",
                "frequencyInMin": 5,
                "replaceable": "",
                "teamName": "MAPI",
                "agentName": "Virgina Sandbox Agent",
                "replaceableData": {
                    "replaceableId": null
                }
            }

            const obj = newObj.data;
            Object.keys(obj).forEach(key => {
                console.log('each key', key);

                if (key === "item") {
                    const collections = obj[key];
                    console.log(key + ": " + newObj[key]);

                    testStepId += testStepId + 1;

                    collections.forEach(data => {

                        /**
                         * @desc Generate based url using encoding
                         */
                        const generateUrl = data => {

                            let url = decodeURI(data.request.url.raw.replace(regex, base_url))
                            // let url = data.request.url.raw.replace(regex, base_url);
                            if(url.indexOf('{{jobid}}') > -1) {
                                url = url.replace(/{{jobid}}/gi, '<jobid>')
                            }

                            return url;
                        }

                        const step = {
                            // testStepId: testStepId,
                            stepType: "API",
                            timeout: 60,
                            softFailureEnabled: false,
                            retryOnFailure: false,
                            retryTest: false,
                            description: data.name,
                            testUrl: generateUrl(data),
                            expectedResponseCode: 200,
                            section: "core",
                            httpMethod: data.request.method,
                            headers: {
                                orgid: "testing",
                                "Content-Type": "application/json"
                            }
                        }

                        const beforeStep = getStepPerRequest(step, data);

                        const afterStep = updateFunctionObject(beforeStep);

                        kaiju.testSteps.push(afterStep);

                    })

                    const result = [];

                    if (kaiju.testSteps.length) {
                        kaiju.numSteps = kaiju.testSteps.length
                        fs.writeFile(`./saved/${server}`, JSON.stringify(kaiju), 'utf8', (err, data) => {
                            if (err) throw err;
                            result.push(data);
                            console.log('Results Received');
                        });
                    }

                    if (!result) {
                        return result;
                    }
                }
            });

        } catch (err) {
            console.error(err)
        }
    });
}

module.exports = { exportJSON }