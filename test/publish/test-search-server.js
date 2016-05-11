// simple rest service used for tests
var express = require('express');
var bodyParser = require('body-parser');

module.exports = function () {

	// map each data item by its id
	var indexedItems = [];
	var siteIndexBeginCalled = false;
	var siteIndexEndCalled = false;

	function error (req, res) {
		res.status(500).send('500');
	}

	function index(req, res) {
		indexedItems.push(req.body);
		res.status(201).send({});
	}

	function siteIndexBegin(req, res) {
		siteIndexBeginCalled = true;
		res.status(200).send({});
	}

	function siteIndexEnd(req, res) {
		siteIndexEndCalled = true;
		res.status(200).send({});
	}

	return {

		wasSiteIndexBeginCalled : function () {
			return siteIndexBeginCalled;
		},

		wasSiteIndexEndCalled : function () {
			return siteIndexEndCalled;
		},


		indexedItems : function () {
				return indexedItems;
		},

		// return true if that item was indexed, false otherwise
		wasIndexed: function (item) {
			item._embedded.format.name = item._embedded.format.name.toLowerCase();
			return indexedItems.indexOf(item) !== -1;
		},

		// start and return a fake version of the content rep server with known behaviour
		startServer : function (port) {
			var app = express();
			app.use(bodyParser.json());
			app.route('/siteIndexBegin').post(siteIndexBegin);
			app.route('/siteIndexEnd').post(siteIndexEnd);
			app.route('/').put(index);
			return app.listen(port);
		},

		startFaultyServer  : function (port) {
			var app = express();
			app.use(bodyParser.json());
			app.route('*').get(error);
			return app.listen(port);
		}
	}
}
