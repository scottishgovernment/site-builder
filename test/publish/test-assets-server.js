// simple rest service used for tests
var express = require('express');
var bodyParser = require('body-parser');

module.exports = function (assets) {

    function get(req, res) {
        if (assets[req.url]) {
            res.status(200).send('dummyassetcontent');
        } else {
            res.status(404).send({});
        }
    }

	return {

		// start and return a fake version of the content rep server with known behaviour
		startServer : function (port) {
			var app = express();
			app.use(bodyParser.json());
			app.route('*').get(get);
			return app.listen(port);
		}
	}
}
