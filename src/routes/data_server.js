'use strict';

const express = require('express');
const app = express()
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true}))

app.get('/services/app', (err, req, res) => {
    if(err) console.log('throwed')
    res.json({
        success: true
    })
})

module.exports = app