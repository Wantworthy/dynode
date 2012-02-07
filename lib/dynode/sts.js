var https = require("https"),
    querystring = require('querystring'),
    crypto = require('crypto'),
    URL = require('url'),
    querystring = require('querystring'),
    AmazonError = require('./amazon-error'),
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
  
  var opts = {
    host : defaults.host,
    path : "/?" + querystring.stringify(this._buildParams())
  };

  var request = https.get(opts, function(res) {
    var data = "";
    
    res.on("data", function(chunk){ data += chunk });
    res.on("end", function() {
      self.parser.parseString(data, function (err, result) {
        if(err) return cb(err);

        if (res.statusCode != 200) {
          return cb(new AmazonError({type : result.Error.Code, message: result.Error.Message, statusCode: res.statusCode}));
        }
        
        self.credentials = result.GetSessionTokenResult.Credentials;
        return cb(null, self.credentials);
      });
    });
  });

  request.on("error", cb);
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