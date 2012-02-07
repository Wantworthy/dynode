var request = require('request'),
    _ = require("underscore"),
    signer = require('./request-signer'),
    AmazonError = require('./amazon-error'),
    URL = require('url'),
    STS = require('./sts').STS;

var Request = exports.Request = function Request(config) {
  this.sts = new STS(config);

  this.config = _.defaults(config, {
    prefix : "DynamoDB_20111205.",
    host : "dynamodb.us-east-1.amazonaws.com"
  });
};

Request.prototype.send = function(action, options, cb) {
  var self = this;

  this.sts.getSessionToken(function(err, credentials) {
    if(err) return cb(err);

    var headers = {
      "host" : self.config.host,
      "x-amz-date" : new Date().toGMTString(),
      "x-amz-security-token" : credentials.sessionToken,
      "x-amz-target" : self.config.prefix + action,
      "content-type" : "application/x-amz-json-1.0"
    };

    var signedHeaders = signer.sign(headers, options, credentials);

    request({
      method : "POST",
      headers : signedHeaders,
      url : URL.format({host:self.config.host, protocol: "https"}),
      body : JSON.stringify(options),
    }, function(err, resp, body) {
      if(err) return cb(err);

      var json = JSON.parse(body);
      if(resp.statusCode != 200) {
        return cb(new AmazonError({type : json["__type"], message: json["message"], statusCode: resp.statusCode}));
      }

      return cb(null, json);
    });
  });

}