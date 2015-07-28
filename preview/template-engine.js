var config = require('config-weaver').config();
var fs = require('fs-extra');
var assemble = require('assemble-handlebars');

var customLayoutDir = __dirname + '/resources/';

assemble.init({
    marked: {
        sanitize: false,
        gmf:true,
        tables:true
    }
});

var templates = {

};

/**
 * see helper.register on handlerbars.
 * uses require to load .js files under provided (_herlpers) directory
 * calls .register method on each helper loaded by passing assembler.handlerbars as argument
 */

function registerHelpers(dir) {
    var path = require('path');
    var helpers = fs.readdirSync(dir);
    for (var i = 0; i < helpers.length; i++) {
        if (helpers[i].substr(-3) === '.js') {
            require(path.resolve(dir) + '/' + helpers[i]).register(assemble.handlebars);
        }
    }
}

/**
 * see handlebars.registerPartials
 * Uses fs-extra to load partial files under provided directory (_partials)
 * registers loaded files
 * overrides clickjack partials with empty string.
 */

function registerPartials(dir) {
    var partials = fs.readdirSync(dir);
    for (var i = 0; i < partials.length; i++) {
        assemble.registerPartial(partials[i].split('.')[0], fs.readFileSync(dir + partials[i], 'UTF-8'));
    }
    // we don't want this partial to be used in preview mode
    // this partial prefenvents displaying content in iframe which is not wanted
    assemble.registerPartial('clickjack', '');
}

/**
 * see handlebars.compile
 * compiles and caches (templates) layouts.
 * there is a watch task for layout folders compile method is called if change dedected
 */

function compileLayouts(dir) {
    var precompiled,
        callback,
        i;
    var layouts = fs.readdirSync(dir);

    callback = function(ex, tmpl) {
        templates[layouts[i]] = tmpl;
    };
    for (i = 0; i < layouts.length; i++) {
        precompiled = fs.readFileSync(dir + layouts[i], 'UTF-8');
        // this is a hack to make custom helpers to work in preview
        precompiled = precompiled.replace('{{body}}', '{{{body}}}');

        assemble.compile(precompiled, {}, callback);
    }
    // custom layouts (i.e error, default)
    // they don't override existing templates
    var customLayouts = fs.readdirSync(customLayoutDir);
    callback = function(ex, tmpl) {
        templates[customLayouts[i]] = tmpl;
    };
    for (i = 0; i < customLayouts.length; i++) {
        if (!templates[customLayouts[i]]) {
            precompiled = fs.readFileSync(customLayoutDir + customLayouts[i], 'UTF-8');
            assemble.compile(precompiled, {}, callback);
        }
    }
}

module.exports = function() {
    return {
        /**
         * applies appropriate template on to json (item)
         * finds compiled template using item.layout property.
         */
        render: function(item, callback) {

            // hack to allow custom helpers to work in preview - we compile the body as a template and apply it to
            // the object.  This causes the helpers to be applied.  We then take the result and put it into the content
            // item before applying the actual template.
            var body = '';

            if (item.body) {
                body = item.body;
            }

            assemble.compile(body, {}, function(ex, bodyTemplate) {
                if (ex) {
                    callback(ex, {message: "Unable to compile body as template", status: 400});
                    return;
                }

                assemble.render(bodyTemplate, item, function(ex, renderedBody) {

                    if (ex) {
                        callback(ex, {message: "Unable to render content", status: 400});
                        return;
                    }
                    item.body = renderedBody;

                    var tmpl = templates[item.layout] || templates['_default.hbs'];
                    assemble.render(tmpl, item, function(ex, renderedContent) {
                        callback(ex, renderedContent);
                    });
                });
            });
        },

        /**
         * Creates handlebars context, this method is called by watch monitor
         * if any change dedected under layouts folder.
         */
        compile: function(layouts, partials, helpers) {
            registerHelpers(helpers);
            registerPartials(partials);
            compileLayouts(layouts);
        }
    };
};
