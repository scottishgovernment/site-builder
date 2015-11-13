var express = require('express');
var app = express();
var logger = require('express-logger');
var cookieParser = require('cookie-parser');

// create content-source to fetch item
var restler = require('restler');
var contentSource = require('./content-source')(restler);

// create template engine to render fetched item
var layouts = './resources/templates/_layouts/';
var partials = './resources/templates/_partials/';
var helpers = './resources/_helpers/';
var engine = require('./template-engine')();
engine.compile(layouts, partials, helpers);

var watch = require('node-watch');

watch([layouts,partials,helpers],function(){
    console.log('Layouts, partials or helpers changed, registering partials and helpers, compiled layouts');
    engine.compile(layouts, partials, helpers);
});

// create routes
var routes = require('./routes')(contentSource, engine);

// fetch the reference data 
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Visibility, X-Accept-Encoding");
  next();
});

app.use(cookieParser());
app.use('/robots.txt',
  express.static(__dirname + '/robots.txt'));

app.use('/',
    express.static('out/css'),
    express.static('app/')
    );

app.route('/*')
    .get(routes.preview)
    .options(function (req, res) {
        res.status(200).end();
    })
    .all(methodNotSupported);

app.route('*').all(function(req, res) {
    res.status(404).send({
        status: 404,
        message: "Not Found"
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
