var util = require('util');

var AmazonError = function(options) {
  this.name = 'AmazonError';

  if(options.type) {
    var split = options.type.split("#");

    this.serviceName = split[0];
    this.type = options.type.split("#")[1];

    if(!this.type){
      this.type = this.serviceName;
      this.serviceName = "Unknown";
    }

  } else {
    this.type = "Unknown Error";
  }

  this.message = options.message;
  this.statusCode = options.statusCode;

  this.__defineGetter__("retry", function() {
    return this.statusCode == 500 || this.type === "ProvisionedThroughputExceededException";
  });

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(AmazonError, Error);

AmazonError.prototype.toString = function() {
  return util.format('%s - %d %s: %s', this.name, this.statusCode, this.type, this.message);
};

module.exports = AmazonError;