function (doc, old, user, security) {

  var jsen = require('lib/jsen');
  var schema = require('lib/publish');

  if (doc.type === 'publish') {
    var validate = jsen(schema);
    var valid = validate(doc);
    if (!valid) {
      throw { forbidden: JSON.stringify(validate.errors, null, 2) };
    }
  }

}
