// Generates AWS V4 signature
// see http://docs.amazonwebservices.com/general/latest/gr/signature-version-4.html
var crypto = require('crypto'),
    util = require('utile');

var Signer = module.exports;

Signer.algorithm = "AWS4-HMAC-SHA256";

Signer.signature = function(credentials, request, date, region) {
  var secret = credentials.secretAccessKey;
  var signedDate = hmac("AWS4" + secret, today(date));
  var signedRegion = hmac(signedDate, region);
  var signedService = hmac(signedRegion, "dynamodb");
  var signedCredentials = hmac(signedService, 'aws4_request');
  
  return hmac(signedCredentials, Signer.stringToSign(request, date, region) );
};

Signer.authorization = function(credentials, request, date, region) {
  return [
    Signer.algorithm + " Credential=" + credentials.accessKeyId + "/" + Signer._credentialScope(date, region),
    "SignedHeaders=" + Signer._signedHeaders(request.headers),
    "Signature=" + hex(Signer.signature(credentials, request, date, region))
  ].join(', ');
};

Signer.canonicalRequest = function(request) {
  return [
    request.method.toUpperCase(),
    request.uri,
    request.query,
    Signer._canonicalHeaders(request.headers) + "\n",
    Signer._signedHeaders(request.headers),
    Signer._digest(request.body || '')
  ].join("\n");
};

Signer.stringToSign = function(request, date, region) {
  return [
    Signer.algorithm, 
    Signer._requestDate(date),
    Signer._credentialScope(date, region),
    Signer._digest(Signer.canonicalRequest(request) )
  ].join("\n");
};

Signer._canonicalHeaders = function(headers) {
  var toSign = headersToSign(headers);

  return toSign.map(function(key) {
    return util.format("%s:%s", key.trim().toLowerCase(), headers[key].trim());
  }).sort().join('\n');
};

Signer._signedHeaders = function(headers) {
  return headersToSign(headers).map(toLower).sort().join(";");
};

Signer._digest = function(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
};

Signer._requestDate = function(date) {
 return date.getUTCFullYear().toString() +
        pad(date.getUTCMonth()+1) +
        pad(date.getUTCDate())+'T' +
        pad(date.getUTCHours()) +
        pad(date.getUTCMinutes()) +
        pad(date.getUTCSeconds())+'Z';
};

Signer._credentialScope = function(date, region) {
  return [today(date), region, "dynamodb/aws4_request"].join("/");
};

function hex(str) {
  return new Buffer(str, "binary").toString("hex");
}

function today(date) {
  return date.getUTCFullYear().toString() + pad(date.getUTCMonth()+1) + pad(date.getUTCDate());
}

function hmac(key, value) {
  return crypto.createHmac('sha256', key).update(value).digest("binary");
}

function pad(n) {
  return n<10 ? '0'+ n : n;
}

var notAuthorization = function(str){return str != 'authorization';};

function headersToSign(headers) {
  return Object.keys(headers).filter(notAuthorization);
}

function toLower(str) {
  return str.trim().toLowerCase();
}