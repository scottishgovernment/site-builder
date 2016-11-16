#!/usr/bin/env node
'use strict';
/**
 * Preview service entry point.
 * Initialises and runs the preview service.
 */
process.title = 'preview';
var express = require('express');
var app = require(__dirname + '/server');
var port = 3000;
var server = app.listen(port);
console.log('Listening on port', port);
