#!/usr/bin/env node
var express = require('express');
var app = require(__dirname + '/server');
var port = 3000;
var server = app.listen(port);
console.log("Listening on port", port);
