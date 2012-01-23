var Client = require("../lib/dynode/client").Client,
    should = require('should');

describe('DynamoDB Client', function() {

  describe("with valid access keys", function() {
    var client = new Client({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});

    it('should list tables', function(done) {

      client.listTables({}, function(err, tables) {
        tables.should.have.property("TableNames");
        done();
      });

    });

    it('should create table', function(done) {
      
      client.createTable("TestTable", function(err, table) {
        console.log(err, table);
        done();
      });

    });    

    it('should describe table', function(done) {
      
      client.describeTable("TestTable", function(err, table) {
        table.TableName.should.equal("TestTable");
        done();
      });

    });

  });
});