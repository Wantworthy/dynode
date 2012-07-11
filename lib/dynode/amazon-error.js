var util = require('util');

function AmazonError(options) {
  if(options.type) {
    var split = options.type.split("#");

    this.type = split.pop();
    this.serviceName = split.pop() || "Unknown";
  }

  this.type = this.type || "UnknownError";
  this.message = options.message;
  this.statusCode = options.statusCode;
  this.action = options.action;

  this.__defineGetter__("retry", function() {
    return this.statusCode == 500 ||
           this.type === "ProvisionedThroughputExceededException" ||
           this.type === "Throttling";
  });

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(AmazonError, Error);

AmazonError.prototype.name = 'AmazonError';

AmazonError.prototype.toString = function() {
  return util.format('%s - %s %d %s: %s', this.name, this.action, this.statusCode, this.type, this.message);
};

module.exports = AmazonError;