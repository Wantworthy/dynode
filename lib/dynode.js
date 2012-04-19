var dynode = exports;

dynode.Client = require('./dynode/client').Client;

var defaultClient;

dynode.auth = function(config) {
  defaultClient = new dynode.Client(config);
};

var methods = [
  'listTables',
  'describeTable',
  'createTable',
  'deleteTable',
  'updateTable',
  'putItem',
  'updateItem',
  'getItem',
  'deleteItem',
  'query',
  'scan',
  'batchGetItem',
  'batchWriteItem',
  'truncate',
  '_request'
];

methods.forEach(function (method) {
  dynode[method] = function () {
    return defaultClient[method].apply(defaultClient, arguments);
  };
});