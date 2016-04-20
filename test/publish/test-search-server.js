// simple rest service used for tests
var express = require('express');
var bodyParser = require('body-parser');

module.exports = function () {

	// map each data item by its id
	var indexedItems = [];
	var indexCleared = false;

	function error (req, res) {
		res.status(500).send('500');
	}

	function index(req, res) {
		indexedItems.push(req.body);
		res.status(201).send({});
	}

	function clearIndex(req, res) {
		indexCleared = true;
		indexedItems = [];
		res.status(204).send({});
	}

	return {

		wasIndexCleared : function () {
			return indexCleared;
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
			app.route('/').put(index);
			app.route('/').delete(clearIndex);
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
