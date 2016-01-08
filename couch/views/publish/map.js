function (doc) {
  if (doc.type === 'publish') {
    var value = {
      type: doc.what,
      createdby: doc.user,
      created: doc.start,
      itemcount: doc.items,
    }
    if (doc.start && doc.end) {
      value.buildTime = new Date(doc.end) - new Date(doc.start);
    }
    emit(doc.start, value);
  }
}
