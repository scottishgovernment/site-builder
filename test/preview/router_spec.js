var sutPath = '../../out/instrument/preview/router';
var url = require('url');
var router = require(sutPath);

describe('Router', function() {

    var next;

    beforeEach(function() {
        next = jasmine.createSpy('next');
    });

    it('should not proxy requests site router returns no upstream URL', function() {
        var siteRouter = jasmine.createSpy('siteRouter');
        var app = {
            createPrepareContext: function() {
                return {};
            }
        };
        var sut = router.create(siteRouter, app);
        siteRouter.andReturn(null);
        var req = url.parse('http://localhost:8080/path');
        req.headers = {};
        req.query = {token:'token'};
        sut(req, {cookie: function(){}}, next);
        expect(siteRouter.calls.length).toBe(1);
        expect(siteRouter.calls[0].args.length).toBe(2);
        expect(siteRouter.calls[0].args[0]).toBe(req);
    });

    it('should proxy requests if the site router returns an upstream URL', function() {
        var siteRouter = jasmine.createSpy('siteRouter');
        var sut = new router.Router(siteRouter);
        var proxy = jasmine.createSpy('proxy');
        sut.proxy = proxy;
        var upstream = url.parse('http://upstream:8080/path');
        var req = url.parse('http://site/');
        siteRouter.andReturn(upstream);
        sut.apply(req, null, next);
        expect(proxy.calls.length).toBe(0);
        expect(next).not.toHaveBeenCalled();
    });

    it('Does not write undefined preview token', function() {
      var siteRouter = jasmine.createSpy('siteRouter');
      var app = {
        createPrepareContext: function (visibility, token) { return {}; }
      };
      var sut = router.create(siteRouter, app);
      siteRouter.andReturn(null);
      var res = {
        cookies : {},
        cookie : function (name, value) {
          this.cookies[name] = value;
        }
      };
      var req = url.parse('http://localhost:8080/path');
      req.query = { };
      req.headers = {};
      req.cookies = {};
      sut(req, res, next);
      expect(res.cookies.preview_token).toBe(undefined);
    });

    it('Writes preview token from param', function() {
        var siteRouter = jasmine.createSpy('siteRouter');
        var app = {
          createPrepareContext: function (visibility, token) { return {}; }
        };
        var sut = router.create(siteRouter, app);
        siteRouter.andReturn(null);
        var res = {
          cookies : {},
          cookie : function (name, value) {
            this.cookies[name] = value;
          }
        };
        var req = url.parse('http://localhost:8080/path');
        req.query = {
          token: 'mytoken'
        };
        req.headers = {};
        req.cookies = {};
        sut(req, res, next);
        expect(res.cookies.preview_token).toBe('mytoken');
    });
});
