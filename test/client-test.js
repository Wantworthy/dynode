var Client = require("../lib/dynode/client").Client,
    should = require('should');

describe('DynamoDB Client', function() {

  describe("with valid access keys", function() {

    it('should list tables', function(done) {
      var client = new Client({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});

      client.listTables({}, function(err, tables) {
        tables.should.have.property("TableNames");
        done();
      });

    });

  });
});