var request = require('request'),
    util = require('util'),
    crypto = require('crypto'),
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

    var headersToSign = Object.keys(headers).filter(function(k){return k.match(/x-amz-|host/);});

    var canonicalHeaders = headersToSign.map(function(key) {
      return util.format("%s:%s\n", key.trim().toLowerCase(), headers[key].trim());
    }).sort().join('');

    var toSign = {
      method : "POST",
      uri : "/",
      query : "",
      headers : canonicalHeaders,
      body : "{}"
    };

    var strToSign = [toSign.method, toSign.uri, toSign.query, toSign.headers, toSign.body].join("\n");

    var hash =  crypto.createHash('sha256');
    hash.update(strToSign);
    var digest = hash.digest('binary');

    var signature = crypto.createHmac('sha256', credentials.secretAccessKey).update(new Buffer(digest, 'binary')).digest("base64");

    headers["x-amzn-authorization"] = "AWS3 AWSAccessKeyId="+credentials.accessKeyId+",Algorithm=HmacSHA256,SignedHeaders="+headersToSign.join(';')+",Signature="+signature;
    
    request({
      method : "POST",
      headers : headers,
      url : "https://dynamodb.us-east-1.amazonaws.com/",
      body : toSign.body
    }, function(err, resp, body) {
      return cb(null, JSON.parse(body));
    });

  });

};