var request = require('request'),
    crypto = require('crypto'),
    URL = require('url'),
    querystring = require('querystring'),
    xml2js = require('xml2js');

var defaults = {
  host    : "sts.amazonaws.com",
  version : "2011-06-15",
  duration : 43200, // 12 hours
  algorithm : "HmacSHA256",
  signatureVersion : 2
};

var STS = exports.STS = function STS(config) {
  if ( !config.accessKeyId || ! config.secretAccessKey) {
    throw new Error('You must set the AWS credentials: accessKeyId + secretAccessKey');
  }

  this.config = config;
  this.parser = new xml2js.Parser();

  var credentials = null;

  Object.defineProperty(this, "credentials", {
    
    get : function () {
      if(credentials && credentials.expiration > new Date()) {
        return credentials;
      } else {
        return null;
      }
    },

    set : function(resp) {
      credentials = {
        sessionToken : resp.SessionToken,
        secretAccessKey : resp.SecretAccessKey,
        expiration : new Date(resp.Expiration),
        accessKeyId : resp.AccessKeyId
      };
    }
  });

};

STS.prototype.getSessionToken = function(cb) {
  if(this.credentials) return cb(null, this.credentials);

  var self = this;
  
  var url = URL.format({host:defaults.host, protocol: "https", query : this._buildParams() });

  request(url, function (err, resp, body) {
    if(err) return cb(err);

    self.parser.parseString(body, function (err, result) {
      if(err) return cb(err);

      if(resp.statusCode != 200){
        console.log(result);
        return cb(new Error(result.Error.Code + ": " + result.Error.Message)); 
      }
        
      self.credentials = result.GetSessionTokenResult.Credentials;
    
      return cb(null, self.credentials); 
    });
  });
};

STS.prototype._buildParams = function() {
  var params = {
    AWSAccessKeyId : this.config.accessKeyId,
    Action : "GetSessionToken",
    DurationSeconds : defaults.duration,
    SignatureMethod : defaults.algorithm,
    SignatureVersion : defaults.signatureVersion,
    Timestamp : (new Date).toISOString(),
    Version : defaults.version
  };

  var toSign = ['GET', defaults.host, "/", querystring.stringify(params)].join("\n");

  var signature = crypto.createHmac('sha256', this.config.secretAccessKey).update(toSign).digest("base64");

  params.Signature = signature;

  return params;
};