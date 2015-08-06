'use strict';
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var exphbs = require('express-handlebars');
var path = require('path');
var yaml = require('js-yaml');
var fs = require('fs');
var config = require('config-weaver').config();
var shelljs = require('shelljs/global');
var allowedTasks = ['build', 'compass'];
var grunt = require('grunt');

var GwwwuntTask = function (task) {
    // Store reference to original task
    this.task = task;

    // Merge task options with defaults
    this.options = task.options(GwwwuntTask.DEFAULT_OPTIONS);
};

/**
 * Default options that will be merged with options specified in
 * the original task.
 *
 * @type {*}
 */
GwwwuntTask.DEFAULT_OPTIONS = {
    port: '7003',
    yamlPath: '.grunt/aliases.yaml',
    keepAlive: false
};

/**
 * Static method for running the tasl.
 *
 */
GwwwuntTask.prototype.run = function () {

    var options = this.task.options(GwwwuntTask.DEFAULT_OPTIONS);


    if (options.keepAlive === true) {
        this.task.async();
    }

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    // view engine setup
    app.set('views', path.join(__dirname + '', '../views'));
    app.engine('.hbs', exphbs({
        extname: '.hbs'
    }));
    app.set('view engine', '.hbs');

    app.use(express.static(__dirname + '../views/css'));

    app.get('/', function(req, res) {

        var tasks = [];
        var doc;

        // Get document, or throw exception on error
        try {
            doc = yaml.safeLoad(fs.readFileSync(options.yamlPath, 'utf8'));
        } catch (e) {
            console.log(e);
        }

        // Loop through all the yaml keyss adding to array
        for (var key in doc) {
            if (doc.hasOwnProperty(key)) {
                tasks.push({
                    name: escape(key),
                    detail: doc[key]
                });
            }
        }

        res.render('index', {
            tasks: tasks
        });
    });

    function ensureAuthorization(req, res, next) {
        var token;
        // Check that we have an Authorization bearer header token
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {

            // Get the auth token from the Authorization header
            token = req.headers.authorization.split(' ')[1];
            var request = require('request');
            request(config.authentication.endpoint + '/' + token, function(error, response, body) {
                // Do we have a valid response with no error?
                if (!error && response.statusCode === 200) {
                    // Got a response, parse it to json
                    var info = JSON.parse(body);
                    // Is the session still alive?
                    if (info.sessionAlive === true) {
                        // Great, go ahead and process the next middleware
                        next();
                    } else {
                        // Your session has expired
                        unauthorized(res, 'Your session has expired, please log in again');
                    }
                } else {

                    unauthorized(res, 'Problem with auth server, can\'t authenticate. Please try later:');
                }

            });

        } else {
            unauthorized(res, 'Auth token not provided');
        }
    }


    app.get('/task/:task', ensureAuthorization, function(req, res, next) {

        if (allowedTasks.indexOf(req.params.task) < 0) {
            //Task not allowed
            unauthorized(res, 'Task not authorised');
        }

        // Get the required task from the list of parameters
        var task = req.params.task;

        // Spit out an HTML page for the task
        res.render('task', {
            name: task
        });


        // Perform the task
        var child = exec('. /etc/profile; grunt ' + task, {
            silent: false,
            async: true
        });

        // Spit out the results to grunt emit
        child.stdout.on('data', function(data) {
        });
    });

    // General function to return a 401 status code with an optional custom message
    function unauthorized(res, msg) {
        res.status(401).send(msg || 'Unauthorised');
        res.end();
    }

    // Listen on the specified port from the grunt target
    server.listen(options.port, function() {
        var host = server.address().address;
        var port = server.address().port;
        console.log('Server listening at http://%s:%s', host, port);

    });

};


module.exports = GwwwuntTask;
