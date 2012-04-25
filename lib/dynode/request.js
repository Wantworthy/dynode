var http        = require("http"),
    _           = require("underscore"),
    signer      = require('./request-signer'),
    AmazonError = require('./amazon-error'),
    URL         = require('url'),
    STS         = require('./sts').STS;

var Request = exports.Request = function Request(config) {
  this.sts = new STS(config);

  this.config = _.defaults(config, {
    prefix : "DynamoDB_20111205.",
    host : "dynamodb.us-east-1.amazonaws.com"
  });

  if(this.config.https) {
    http = require("https");
  }
};

Request.prototype.send = function(action, messageBody, cb) {
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

    var opts = {
      method : "POST",
      headers : signer.sign(headers, messageBody, credentials),
      host: self.config.host
    };

    var request = http.request(opts, function(res) {
      var data = "";

      res.on("data", function(chunk){ data += chunk });
      res.on("end", function() {
        var response = JSON.parse(data);

        if (res.statusCode != 200) {
          return cb(new AmazonError({type : response["__type"], message: response["message"], statusCode: res.statusCode, action: action}));
        }
        
        return cb(null, response);
      });
    });

    request.on("error", cb);

    request.write(JSON.stringify(messageBody));
    request.end();
  });

}