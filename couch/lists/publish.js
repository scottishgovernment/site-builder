function (head, req) {
  start({
    'headers': {
      'Content-Type': 'application/json'
    }
  });
  var rows = [];
  var result = {
    pubs: rows
  }
  while (row = getRow()) {
    rows.push(row.value);
  }
  send(JSON.stringify(result, null, 2));
}
