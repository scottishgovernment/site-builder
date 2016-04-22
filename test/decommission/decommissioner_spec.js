var sutPath = '../../out/instrument/decommission/decommissioner';

describe('decommissioner', function() {

    var testRest = require('./test-decommissioned-sites-server')();
    var authPort = 1110
    var testAuthPort = 1111;
    var tempDir = __dirname + '/../../out/decommission';

    beforeEach(function(done) {

        var temp = require('temp');
        temp.mkdir('',
            function(err, dirPath) {
                tempDir = dirPath;
                done();
            }
        );
    });
    
    it('early return when disbaled', function (done) {
        var config = {
            authentication : {
                enabled: false
            },
            decommissionTool : {
                enabled: false
            }
        };
        var sut = require(sutPath)(config);
        sut.createRedirects(function (err) {
            done();
        });
            
    });

    function test(config, port, sites, pages, done) {
        
        testRest.startGreenpathServer(port, sites, pages);

        var sut = require(sutPath)(config);
        sut.createRedirects(function (err) {
            var redirectFile = require('fs').readFileSync(tempDir + '/decommissioned/alpha.mygov.scot.conf');
            done();
        });
    }

    it('green path (no auth)', function(done) {

        var testPort = 1113;
        var baseSitesUrl = 'http://localhost:'+testPort+'/redirects/sites/';
        var basePagesUrl = 'http://localhost:'+testPort+'/redirects/sites/';

        var sites = {
            "_embedded" : {
                "sites" : [ {
                    "id" : "alpha",
                    "host" : "alpha.mygov.scot",
                    "name" : "Test Name",
                    "description" : "Test Desc",
                    "siteMatchMsg" : "site msg",
                    "categoryMatchMsg" : "category msg",
                    "pageMatchMsg" : "page msg",
                    "_links" : {
                        "self" : {
                            "href" : baseSitesUrl+"alpha",
                        },
                        "pages" : {
                            "href" : baseSitesUrl+"alpha/pages"
                        }
                    }
                } ]
            }
        };
        var pages = [
            {
                "id": "alpha",
                "response": {
                    "_embedded" : {
                        "pages" : [ 
                            {
                                "srcUrl": "/srcUrl/",
                                "targetUrl": "/target/url/",
                                "redirectType": "REDIRECT"
                            }
                        ]
                    }
                }
            }];
        var config = {
            authentication : {
                enabled: false
            },
            nginx: tempDir,
            decommissionTool : {
                enabled: true,
                url: "http://localhost:"+testPort+"/",
                siteUrl: "http://www.mygov.scot/"
            }
        };
        test(config, testPort, sites, pages, done);
    });

    it('green path (with auth)', function(done) {

        var testPort = 1112;
        var baseSitesUrl = 'http://localhost:'+testPort+'/redirects/sites/';
        var basePagesUrl = 'http://localhost:'+testPort+'/redirects/sites/';

        var sites = {
            "_embedded" : {
                "sites" : [ {
                    "id" : "alpha",
                    "host" : "alpha.mygov.scot",
                    "name" : "Test Name",
                    "description" : "Test Desc",
                    "siteMatchMsg" : "site msg",
                    "categoryMatchMsg" : "category msg",
                    "pageMatchMsg" : "page msg",
                    "_links" : {
                        "self" : {
                            "href" : baseSitesUrl+"alpha",
                        },
                        "pages" : {
                            "href" : baseSitesUrl+"alpha/pages"
                        }
                    }
                } ]
            }
        };
        var pages = [
            {
                "id": "alpha",
                "response": {
                    "_embedded" : {
                        "pages" : [ 
                            {
                                "srcUrl": "/srcUrl/",
                                "targetUrl": "/target/url/",
                                "redirectType": "REDIRECT"
                            }
                        ]
                    }
                }
            }];
        var config = {
            authentication : {
                enabled: true,
                endpoint: 'http://localhost:'+authPort+'/',
                user: "build.api@mygov.scot",
                password: "Temp123!"
            },
            nginx: tempDir,
            decommissionTool : {
                enabled: true,
                url: "http://localhost:"+testPort+"/",
                siteUrl: "http://www.mygov.scot/"
            }
        };
        require('./test-auth-server')().startAuthServer(authPort);
        test(config, testPort, sites, pages, done);
    });
});
