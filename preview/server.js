var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var path = require('path');

var config = require('config-weaver').config();

process.mode = 'preview';
process.previewCache = require('./preview-cache')();

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
var referenceDataSource = require('../publish/referenceDataSource')(config, 'out/referenceData.json');
var pagePreview = require('./page-preview')(referenceDataSource, contentSource, renderer);

// If configured, setup watching for changes
if (config.preview && config.preview.watch) {

  var Gaze = require('gaze').Gaze;
  var watchPaths = [
      layouts + '/**/*',
      partials + '/**/*'
  ];
  var gaze = new Gaze(watchPaths, { 'mode': 'poll' }, function() {
      console.log('Watching for changes in layouts or partials');
      gaze.on('all', function() {
        console.log('Layouts or partials changed');
        renderer.reload();
      });
    }
  );

}

var routerPath = path.join(process.cwd(), 'resources/routes/route.js');
if (require('fs').existsSync(routerPath)) {
    var siteRouter = require(routerPath);
    var router = require('./router');
    var routing = router.create(siteRouter.create(config));
    app.use(routing);
}

var amphoraProxy = require('./amphora-proxy')(config);
amphoraProxy.use(app);

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
    .get(pagePreview.preview)
    .options(function (req, res) {
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
