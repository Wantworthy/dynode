var request = require('request'),
    URL = require('url'),
    signer = require('./request-signer'),
    STS = require('./sts').STS;

var defaults = {
  serviceName : "DynamoDB",
  apiVersion  : "20111205",
  host : "dynamodb.us-east-1.amazonaws.com",
  algorithm : "HmacSHA256"
};

var actions = {
  createTable : "DynamoDB_20111205.CreateTable",
  listTables : "DynamoDB_20111205.ListTables"
};

var Client = exports.Client = function Client(config) {
  if ( !config.accessKeyId || ! config.secretAccessKey) {
    throw new Error('You must set the AWS credentials: accessKeyId + secretAccessKey');
  }

  this.config = config;
  this.sts = new STS(config);
};

Client.prototype.listTables = function(options, cb) {
  this.sts.getSessionToken(function(err, credentials) {
    if(err) return cb(err);

    var headers = {
      "host" : defaults.host,
      "x-amz-date" : new Date().toGMTString(),
      "x-amz-security-token" : credentials.sessionToken,
      "x-amz-target" : actions.listTables,
      "content-type" : "application/x-amz-json-1.0"
    };

    var body = {};
    var signedHeaders = signer.sign(headers, body, credentials);

    request({
      method : "POST",
      headers : signedHeaders,
      url : URL.format({host:defaults.host, protocol: "https"}),
      body : JSON.stringify(body),
    }, function(err, resp, body) {
      return cb(null, JSON.parse(body));
    });

  });
};