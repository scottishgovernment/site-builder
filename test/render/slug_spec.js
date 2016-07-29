var sutPath = '../../common/slugify';
var slugify = require(sutPath);

describe('slugify', function() {

    beforeEach(function() {
        var string = "";
        var slug = "";
    });

    it('should be lowercase', function() {
        var string = "Register your LLP";
        var slug = slugify(string);
        expect(slug).toEqual("register-your-llp");
    });

    it('should remove extra dashes (starting, trailing and doubles)', function() {
        var string = "--- --string--for--testing--- -----";
        var slug = slugify(string);
        expect(slug).toEqual("string-for-testing");
    });

    it('should strip non-word characters (ampersand)', function() {
        var string = "tom & jerry";
        var slug = slugify(string);
        expect(slug).toEqual("tom-jerry");
    });

    it('should strip non-word characters (question mark)', function() {
        var string = "What is forced marriage?";
        var slug = slugify(string);
        expect(slug).toEqual("what-is-forced-marriage");
    });

    it('should strip non-word characters (apostrophe)', function() {
        var string = "Members' responsibilities";
        var slug = slugify(string);
        expect(slug).toEqual("members-responsibilities");
    });

    it('should strip non-word characters (unicode - ♥)', function() {
        var string = "i ♥ string";
        var slug = slugify(string);
        expect(slug).toEqual("i-string");
    });

    it('should strip other symbols', function() {
        var string = "{}^~#;'.string[]_|/'';''`";
        var slug = slugify(string);
        expect(slug).toEqual("string");
    });

    it('should strip spaces, including after punctuation', function() {
        var string = " can we fix it? no";
        var slug = slugify(string);
        expect(slug).toEqual("can-we-fix-it-no");
    });

});
