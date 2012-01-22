var STS = require("../lib/sts").STS,
    should = require('should');

describe('STS', function() {
  var sts = new STS({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});

  it('should get session token', function(done) {
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