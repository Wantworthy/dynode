var Client = require("../lib/dynode/client").Client,
    should = require('should');

describe('DynamoDB Client', function() {
  var client;

  describe("with valid access keys", function() {

    before(function(){
      client = new Client({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
    });

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

  describe("PutItem", function() {
    before(function() {
      client = new Client({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
    });

    it('should create new item', function(done) {
      client.putItem("TestTable", {id : "Blah", foo: "Bar", num: 123, baz : ["a", "b", "c"]}, function(err, resp) {
        done(err);   
      });

    });
  });

  describe("GetItem", function() {
       
    before(function(done) {
      client = new Client({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
      client.putItem("TestTable", {id : "TestItem", foo: "Bar"}, done);
    });

    it('should get item', function(done) {
      client.getItem("TestTable", "TestItem", function(err, item, meta) {
        item.should.eql({id : "TestItem", foo: "Bar"});
        meta.ConsumedCapacityUnits.should.equal(0.5);
        done(err);
      });

    });
  });

});