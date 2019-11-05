const fs = require('fs'),
    dir = __dirname + '/postman/',
    base_url = 'https://readmode.com';
    //define environments var as -> internal.${environment}.sfmapsapi
/* 
  testCaseId, testStepId could be some random numbers
*/
let DEFAULT = 9670;
let testStepId = 20081;

/**
 * return JSON object from a list of objects
 * @param {Array} list list of objects
 */
const convertToJSON = list => {
    //convert
    const result = {};
    for (let i = 0; i < list.length; i++) {
        Object.assign(result, list[i])
    }  

    return result;
}

/**
 * Retrieve and convert to kaiju json format
 * @param {File} files json postman collection files
 */
const saveFilesToJSON = files => {

    const result = [];

    files.forEach( file => {
        const newObj = JSON.parse(JSON.stringify(file))
        
        let testCaseId = DEFAULT++

        try {

            const server = file.filename;
            const regex = /{{base_url}}/gi;
            const kaiju = {
                "owner": {
                "teamName": "DEV",
                "ownerId": 334,
                "email": "anyone@salesforce.com"
                },
                "testSteps": [],
                "testCaseId": testCaseId,
                "name": server,
                "description": "Maps",
                "testCaseEnabled": true,
                "prometheusEnabled": false,
                "frequency": 300,
                "timeout": 60,
                "dependentTestSteps": false,
                "agents": [
                {
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
                }
                ],
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
                    "email": "aohare@salesforce.com"
                },
                "name": "Authentication",
                "description": "authorize api",
                "type": "UI",
                "secretKeys": ["x-api-key"],
                "createdTime": new Date().getTime(),
                "updatedTime": new Date().getTime()
                },
                "numSteps": 5,
                "updatedDateTime": "2019-11-04T19:56:13.126Z",
                "createdDateTime": "2019-11-04T15:52:34.668Z",
                "frequencyInMin": 5,
                "replaceable": "",
                "teamName": "MAPI",
                "agentName": "Virgina Sandbox Agent",
                "replaceableData": { "replaceableId": null }
            }

            const obj = newObj.data;
            Object.keys(obj).forEach( key => {
                console.log('each key', key);

                if (key === "item") {
                    const collections = obj[key];
                    console.log(key+": "+newObj[key]);

                    testStepId += testStepId+1;

                    collections.forEach( data => {
                        const step = {
                            testStepId: testStepId,
                            stepType: "API",
                            stepNumber: 1,
                            timeout: 60,
                            softFailureEnabled: false,
                            retryOnFailure: false,
                            retryTest: false,
                            description: data.name,
                            testUrl: `${data.request.url.raw.replace(regex, base_url)}`,
                            expectedResponseCode: 200,
                            section: "core",
                            httpMethod: data.request.method,
                            headers: {
                                orgid: "testing",
                                "Content-Type": "application/json"
                            }
                        }

                        if(data.name === '200 Log in') {
                            step.javaScript = {
                                "post": "function executeAfterStep(currentStep, retryIndex) {\n    try {\n        const response = JSON.parse(currentStep.getResponseString());\n        const auth_token = 'Bearer ' + response.data.token\n        console.log('<auth_token>', auth_token)\n        testCase.setVariable('<auth_token>', auth_token)\n    } catch (error) {\n        console.log(error)\n    }\n}"
                            };
                            step.headers = Object.assign(step.headers, {
                                "x-api-key": "<secret.x-api-key>",
                            });
                        } else if(!!data.request.body) {
                            step.postContent = data.request.body;
                        } else if(!!data.request.url.query) {
                            //TODO replacing formParameters from query parameters
                            console.log(data.request.url.query)
                            const newQuery = data.request.url.query.map( propertyName => {
                                let obj = {}
                                const values = Object.values(propertyName)
                                obj[`${values[0]}`] = values[1];
                                return obj;
                            });

                            const result = convertToJSON(newQuery)

                            step.formParameters = result;
                        } else { 
                            if(Array.isArray(data.request.header)) {
                                const newHeader = data.request.header.map( propertyName => {

                                    let obj = {}
                                    const values = Object.values(propertyName)

                                    if(propertyName.key === 'Authorization'){
                                        const reg = /{{auth_token}}/
                                        obj[`${values[0]}`] = values[1].replace(reg, '<auth_token>');
                                    } else {
                                        obj[`${values[0]}`] = values[1];
                                    }
                                    return obj;
                                });

                                const result = convertToJSON(newHeader)

                                step.headers = result;
                            }
                            else {
                                step.headers = Object.assign(step.headers, {
                                    "Authorization": "<auth_token>"
                                });
                            }
                        }

                        kaiju.testSteps.push(step);

                    })

                    if(kaiju.testSteps.length) {
    
                        fs.writeFile(`./saved/maio-maps${server}.json`, JSON.stringify(kaiju), 'utf8', (err, data) => {
                            if (err) throw err;
                            console.log('Results Received');
                        });
                    }
                }
            }); 

        } catch(err) {
            console.error(err)
        }
    });
}

// main
const filesTo = [];
fs.readdirSync(dir).forEach( file => filesTo.push({
    filename: file,
    data: require(dir + file)
}))

saveFilesToJSON(filesTo)