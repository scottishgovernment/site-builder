// simple rest service used for tests
var express = require('express');
var bodyParser = require('body-parser');

module.exports = function (data) {

	// map each data item by its id
	var byID = {};
	data.forEach(function(datum) {
		byID[datum.uuid] = datum;
	});

	// return an array of ids
	function getIDs (req, res) {
		var ids = [];
		data.forEach(function (datum) {
			ids.push(datum.uuid);
		});
		res.status(200).send(JSON.stringify(ids, null, '\t'));
	}

	// return an array of ids
	function getUnknownIDs (req, res) {
		var ids = [];
		ids.push('unknown-item1');
		ids.push('unknown-item3');
		res.status(200).send(JSON.stringify(ids, null, '\t'));
	}

	function getBadlyFormedIDs (req, res) {
		res.status(200).send('["id1", "id2", ');
	}


	// return the data item with this uuid
	function getByID (req, res) {
		var item = byID[req.params.uuid];
		if (item) {
			res.status(200).send(JSON.stringify(item, null, '\t'));
		} else {
			res.status(404).send('404');
		}
	}

	function getByIDBadlyFormed (req, res) {
		var item = byID[req.params.uuid];
		if (item) {
			res.status(200).send(JSON.stringify(item, null, '\t').substring(0, 10));
		} else {
			res.status(404).send('404');
		}
	}

	function error (req, res) {
		res.status(404).send('404');
	}

	return {

		// start and return a fake version of the content rep server with known behaviour
		startServer : function (port) {
			var app = express();
			app.use(bodyParser.json());
			app.route('/items/').get(getIDs);
			app.route('/items/:uuid').get(getByID);
			return app.listen(port);
		},

		start404Server  : function (port) {
			var app = express();
			app.use(bodyParser.json());
			app.route('*').get(error);
			return app.listen(port);
		},

		start404ForItemServer  : function (port) {
			var app = express();
			app.use(bodyParser.json());
			app.route('/items/').get(getUnknownIDs);
			app.route('/items/:uuid').get(getByID);
			return app.listen(port);
		},

		startBadlyFormedJSONForIDsServer : function (port) {
			var app = express();
			app.use(bodyParser.json());
			app.route('/items/').get(getBadlyFormedIDs);
			return app.listen(port);
		},

		startBadlyFormedJSONForItemServer : function (port) {
			var app = express();
			app.use(bodyParser.json());
			app.route('/items/').get(getIDs);
			app.route('/items/:uuid').get(getByIDBadlyFormed);
			return app.listen(port);
		}		
	}
}
