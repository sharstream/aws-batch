'use strict';

const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: extras, verbose: extras });
require('ajv-keywords')(ajv);

const event_schema = {
    data: {
        type: 'object',
        required: ['status', 'message'],
        properties: {
            message: {
                type: 'string'
            },
            status: {
                type: 'string'
            }
        }
    }
}

const valdiate_events = events => {
    const invalid_events = [];
    valid_events = events.filter(event => {
        const valid = ajv.validate(event_schema, event);
        if(!valid) {
            const failed_schema = {
                message: 'schema validation  error',
                errors: []
            }

            ajv.errors.forEach(ajv_error => {
                failed_schema.error.push({
                    field: ajv_error.dataPath,
                    reason: ajv_error.message
                })
            })
            invalid_events.push(failed_schema);
        }

        return valid;
    })

    const finalEvents = { invalidEvents: null, validEvents: valid_events };
    if(invalid_events.length > 0) {
        finalEvents.invalidEvents = invalid_events;
    }

    return finalEvents;
}

const push_sqs_event_to_kinesis = async (events, opts) => {
    const { invalidEvents, validEvents } = valdiate_events(events);

    const finalErrorResponse = {
        kinesis_errors = null,
        validation_errors = null
    };

    noValidalidEventsExist = validEvents.length === 0;
    validEventsExist = validEvents.length > 0;

    if(noValidalidEventsExist) throw finalErrorResponse;

    else {
        try {
            const response = await push_message_kinesis(invalidEvents, opts);
            if(validEventsExist) return response;
        } catch (error) {
            if(error instanceof Error) {
                const standardError = {
                    message: 'Unhandler error api'
                }

                finalErrorResponse.kinesis_errors = standardError;
            }

            else {
                finalErrorResponse.kinesis_errors = error;
            }
        }

        throw finalErrorResponse;
    }
}

module.exports = { push_sqs_event_to_kinesis };