// simple rest service used for tests
var express = require('express');
var bodyParser = require('body-parser');

module.exports = function () {

	function error (req, res) {
		res.status(500).send('500');
	}

	function json(req, res) {
		res.send({"orginalName":"Sample.pdf","type":"application/pdf","etag":"123456789","uuid":"ac4c3c4d-7e30-4bfa-8ccd-bd538a0d96c9","pages":2,"lastUpdated":"2016-02-12T10:34:30.000+0000","size":185375,"modified":"2012-08-31T10:37:02.000+0000","binaries":["/ac4c3c4d-7e30-4bfa-8ccd-bd538a0d96c9/sample.pdf","/ac4c3c4d-7e30-4bfa-8ccd-bd538a0d96c9/sample.107.jpg"]});
	}

	function pdf(req, res) {
		res.status(100).send({});
	}

	function jpg(req, res) {
		res.status(100).send({});
	}

	return {

		// start and return a fake version of the content rep server with known behaviour
		startServer : function (port, callback) {
			var app = express();
			app.use(bodyParser.json());
			// app.route('*pdf').get(pdf);
			// app.route('*jpg').get(jpg);
			app.route('*').get(json);
			callback(app.listen(port));
		},

		startFaultyServer  : function (port) {
			var app = express();
			app.use(bodyParser.json());
			app.route('*').get(error);
			return app.listen(port);
		}
	}
}
