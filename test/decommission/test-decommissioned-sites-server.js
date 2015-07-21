var express = require('express');
var bodyParser = require('body-parser');

module.exports = function () {

	return {

		startGreenpathServer : function (port, sites, pages) {
			var app = express();
			app.use(bodyParser.json());

			app.route('/redirects/sites/').get(
				function (req, res) {
					res.status(200).send(JSON.stringify(sites, null, '\t'));
				});
			
			pages.forEach(function (site) {
				app.route('/redirects/sites/'+site.id+'/pages/').get(
					function (req, res) {
						res.status(200).send(JSON.stringify(site.response, null, '\t'));
					});	
				});

			return app.listen(port);
		}
	};
};
