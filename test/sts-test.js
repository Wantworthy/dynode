var STS = require("../lib/sts").STS,
    should = require('should');

describe('STS', function() {
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
        err.should.match(/InvalidClientTokenId/);
        should.not.exist(credentials);

        done();
      });

    });

  });

});