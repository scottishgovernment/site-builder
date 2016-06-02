var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var path = require('path');

var config = require('config-weaver').config();

process.mode = 'preview';

if (config.amphora) {
    var proxy = require('express-http-proxy');
    var amphoraStorageProxy = proxy(config.amphora.host, {
        forwardPath: function (req, res) {
          return '/storage' + require('url').parse(req.baseUrl).path;
        }
    });
    var amphoraResourceProxy = proxy(config.amphora.host, {
        forwardPath: function (req, res) {
          return require('url').parse(req.baseUrl).path;
        }
    });
    app.use("/resource/publications/*", amphoraResourceProxy);
    // the files will be served from amphora
    app.use("/publications/*.*", amphoraStorageProxy);
}

// create template engine to render fetched item
var layouts = 'resources/templates/_layouts';
var partials = 'resources/templates/_partials';
var helpers = path.join(process.cwd(), 'resources/_helpers');
var render = require(path.join(__dirname, '../render/render'));
var renderer = new render.Renderer(layouts, partials, helpers);

process.on('uncaughtException', function(ex) {
    console.log('Preview service is unable to handle the error: \n' + ex.stack);
});

// create content-source to fetch item
var restler = require('restler');
var contentSource = require('./content-source')(restler, renderer);

// create routes

var referenceDataSource = require('../publish/referenceDataSource')(config, 'out/referenceData.json');
var routes = require('./routes')(referenceDataSource, contentSource, renderer);

// If configured, setup watching for changes
if (config.preview && config.preview.watch) {

  var Gaze = require('gaze').Gaze;
  var gaze = new Gaze([layouts+'/**/*', partials+'/**/*', helpers+'/**/*' ] ,
    { 'mode': 'poll'},
    function() {
      console.log('Watching for changes in layouts, partials or helpers');
      gaze.on('all', function(event, filepath) {
        console.log('Layouts, partials or helpers changed');
        renderer.reload();
      });
    }
  );

}

// fetch the reference data
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Visibility, X-Accept-Encoding");
  next();
});

// cookieParser provides access to the authentication token via req.cookies
app.use(cookieParser());

app.use('/robots.txt',
  express.static(__dirname + '/robots.txt'));

app.use('/',
    express.static('out/css'),
    express.static('out/pdfs'),
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
