var crypto = require('crypto'),
    util = require('utile');

var Signer = exports;

var isAmzHeader = function(str){return str.match(/x-amz-|host/)};

Signer.headersToSign = function(headers) {
  return Object.keys(headers).filter(isAmzHeader);
};

Signer.sign = function(headers, body, credentials) {
  var headersToSign = Signer.headersToSign(headers);

  var canonicalHeaders = headersToSign.map(function(key) {
    return util.format("%s:%s\n", key.trim().toLowerCase(), headers[key].trim());
  }).sort().join('');

  var toSign = {
    method : "POST",
    uri : "/",
    query : "",
    headers : canonicalHeaders,
    body : JSON.stringify(body)
  };

  var strToSign = [toSign.method, toSign.uri, toSign.query, toSign.headers, toSign.body].join("\n");

  var signature = Signer.generateSignature(strToSign, credentials.secretAccessKey);

  var authorization = "AWS3 AWSAccessKeyId="+credentials.accessKeyId+",Algorithm=HmacSHA256,SignedHeaders="+headersToSign.join(';')+",Signature="+signature;

  return util.mixin({}, headers, {"x-amzn-authorization": authorization});
};

Signer.generateSignature = function(strToSign, key) {
  var digest =  crypto.createHash('sha256').update(strToSign, 'utf8').digest('binary');
  return crypto.createHmac('sha256', key).update(new Buffer(digest, 'binary')).digest("base64");
};