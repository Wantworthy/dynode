var dynode = exports;

dynode.Client = require('./dynode/client').Client;

var defaultClient;

dynode.auth = function(config) {
  defaultClient = new dynode.Client(config);
};