var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var path = require('path');

var config = require('config-weaver').config();

process.on('uncaughtException', function(ex) {
    console.log('Preview service is unable to handle the error: \n' + ex.stack);
});

// create content-source to fetch item
var restler = require('restler');

var site = require('../common/site')();
var renderer = require('./renderer');

var appContext = require('../publishing/app')(config, site, true);
process._appContext = appContext;

// If configured, setup watching for changes
if (config.preview && config.preview.watch) {
    var Gaze = require('gaze').Gaze;
    var watchPaths = ['resources/templates/_layouts/**/*', 'resources/templates/_partials/**/*'
    ];
    var gaze = new Gaze(watchPaths, { 'mode': 'poll' }, function() {
        console.log('Watching for changes in layouts or partials');
        gaze.on('all', function() {
            console.log('Layouts or partials changed');
            appContext.renderer.reload();
        });
    });
}

// cookieParser provides access to the authentication token via req.cookies
app.use(cookieParser());

app.use('/robots.txt',
    express.static(__dirname + '/robots.txt'));

app.use('/',
    express.static(path.join(config.tempdir, 'css')),
    express.static(path.join(config.tempdir, 'pdfs')),
    express.static('app/')
);

if (site.router) {
    var router = require('./router');
    var routing = router.create(site.router(), appContext);
    app.use(routing);
}

app.use(renderer.create());

app.route('/*')
    .options(function(req, res) {
        res.status(200).end();
    })
    .all(methodNotSupported);

app.route('*').all(function(req, res) {
    res.status(404).send({
        status: 404,
        message: 'Not Found'
    });
});

app.use(function(err, req, res, next) {
    console.log(err);
    res.status(500).send({
        status: 500,
        message: 'Server Error:'
    });
    next();
});

function methodNotSupported(req, res) {
    res.statusCode = 405;
    res.send({
        status: 405,
        message: 'Method Not Supported',
        details: {
            path: req.url,
            method: req.method
        }
    });
}

module.exports = app;
