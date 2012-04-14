var STS = require("../../lib/dynode/sts").STS,
    should = require('chai').should();

describe('STS Client Integration Tests', function() {
  var sts;

  describe("with valid access keys", function() {

    it('should get session token', function(done) {
      sts = new STS({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});

      sts.getSessionToken(function(err, credentials) {

        should.exist(credentials.sessionToken);
        should.exist(credentials.secretAccessKey);
        should.exist(credentials.accessKeyId);
        should.exist(credentials.expiration);
        credentials.expiration.should.be.an.instanceof(Date);

        done();
      });
    });

  });

  describe("with invalid access keys", function() {

    it('should return Invalid Token Error', function(done) {
      sts = new STS({accessKeyId : "asdfasdfasdf", secretAccessKey: "asdf"});

      sts.getSessionToken(function(err, credentials) {
        err.type.should.equal("InvalidClientTokenId");
        should.not.exist(credentials);

        done();
      });

    });

    it('should throw exception when access key isnt given', function() {
      var func = function(){ new STS({secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});};
      
      should.throw(func);
    });

    it('should throw exception when secret access key isnt given', function() {
      var func = function(){ new STS({accessKeyId: process.env.AWS_ACCEESS_KEY_ID});};
      
      should.throw(func);
    });

  });

});