var express = require('express');
var bodyParser = require('body-parser');

module.exports = function () {

	return {

		startAuthServer : function (port) {
			var app = express();
			app.use(bodyParser.json());

			app.route('/').post(
				function (req, res) {
					res.status(200).send(JSON.stringify("{ sessionId : 'authtoken' }"));
				});
			
			app.route('/:authtoken').delete(
				function (req, res) {
					res.status(201).send(JSON.stringify('{}'));
				});
			return app.listen(port);
		}
	};
};