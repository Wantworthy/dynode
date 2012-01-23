var request = require('request'),
    URL = require('url'),
    signer = require('./request-signer'),
    STS = require('./sts').STS;

var defaults = {
  prefix : "DynamoDB_20111205.",
  host : "dynamodb.us-east-1.amazonaws.com"
};

var Client = exports.Client = function Client(config) {
  if ( !config.accessKeyId || ! config.secretAccessKey) {
    throw new Error('You must set the AWS credentials: accessKeyId + secretAccessKey');
  }

  this.config = config;
  this.sts = new STS(config);
};

Client.prototype.listTables = function(options, cb) {
  this._request("ListTables", options, cb);
};

Client.prototype._request = function(action, options, cb) {
  this.sts.getSessionToken(function(err, credentials) {
    if(err) return cb(err);

    var headers = {
      "host" : defaults.host,
      "x-amz-date" : new Date().toGMTString(),
      "x-amz-security-token" : credentials.sessionToken,
      "x-amz-target" : defaults.prefix + action,
      "content-type" : "application/x-amz-json-1.0"
    };

    var signedHeaders = signer.sign(headers, options, credentials);

    request({
      method : "POST",
      headers : signedHeaders,
      url : URL.format({host:defaults.host, protocol: "https"}),
      body : JSON.stringify(options),
    }, function(err, resp, body) {
      if(err) return cb(err);

      return cb(null, JSON.parse(body));
    });

  });
};