var http        = require("http"),
    _           = require("underscore"),
    Signer      = require('./aws-signer'),
    AmazonError = require('./amazon-error');

var Request = exports.Request = function Request(config) {
  this.credentials = {accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey};

  if ('securityToken' in config)
    this.credentials.securityToken = config.securityToken;

  this.config = _.defaults(config, {
    prefix : "DynamoDB_20111205.",
    region: "us-east-1"
  });

  this.config.host = "dynamodb." +  this.config.region + ".amazonaws.com";

  if(this.config.https) {
    http = require("https");
  }
};

Request.prototype.send = function(action, messageBody, cb) {
  var self = this,
      date = new Date();

  var headers = {
    "host" : self.config.host,
    "x-amz-date" : Signer._requestDate(date),
    "x-amz-target" : self.config.prefix + action,
    "content-type" : "application/x-amz-json-1.0"
  };

  var req = {
    method : "POST",
    uri : "/",
    query : "",
    headers : headers,
    body : JSON.stringify(messageBody)
  };

  headers.authorization = Signer.authorization(self.credentials, req, date, self.config.region);

  if ('securityToken' in self.credentials)
    headers["x-amz-security-token"] = self.credentials.securityToken;

  var opts = {
    method : req.method,
    path : req.uri,
    headers : headers,
    host: self.config.host
  };

  var request = http.request(opts, function(res) {
    var data = "";

    res.on("data", function(chunk){ data += chunk; });
    res.on("end", function() {
      var response = JSON.parse(data);

      if (res.statusCode != 200) {
        return cb(new AmazonError({type : response["__type"], message: response["message"], statusCode: res.statusCode, action: action}));
      }
      
      return cb(null, response);
    });
  });

  request.on("error", cb);

  request.write(req.body);
  request.end();

};