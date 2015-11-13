#!/usr/bin/env node
var express = require('express');
var app = require(__dirname + '/server');
var port = 3000;
var server = app.listen(port);

// fetch and savereference data
var config = require('config-weaver').config();
var referenceDataSource = require('../publish/referenceDataSource')(config, 'out/referenceData.json');

referenceDataSource.writeReferenceData(function () { 
    console.log('Fetched reference Data.');
});


console.log("Listening on port", port);
