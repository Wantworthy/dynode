var Client = require("../lib/dynode/client").Client,
    DynamoDB = require('./test-helper'),
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

  describe("Put Item", function() {
    before(function() {
      client = new Client({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
    });

    it('should create new item', function(done) {
      client.putItem("TestTable", {id : "Blah", foo: "Bar", num: 123, baz : ["a", "b", "c"]}, function(err, resp) {
        done(err);   
      });

    });
  });

  describe("Get Item", function() {
    
    before(function(done) {
      client = DynamoDB.client;
      DynamoDB.createProduct({id : "TestItem", foo: "Bar"}, done);
    });

    it('should get item', function(done) {
      client.getItem("TestTable", "TestItem", function(err, item, meta) {
        item.should.eql({id : "TestItem", foo: "Bar"});
        meta.ConsumedCapacityUnits.should.equal(0.5);
        done(err);
      });

    });
  });

  describe("Scan", function() {
    
    before(function(done) {
      client = DynamoDB.client;
      DynamoDB.createProducts(DynamoDB.products, done);
    });

    it('should get all items', function(done) {
      client.scan(DynamoDB.TestTable, function(err, items, meta) {
        items.should.have.length(meta.Count);
        done(err);
      });

    });

    it('should accept limit filter', function(done) {
      client.scan(DynamoDB.TestTable,{Limit: 2}, function(err, items, meta) {
        items.should.have.length(2);
        meta.Count.should.equal(2);
        done(err);
      });

    });

  });

  describe("Delete Item", function() {
    
    beforeEach(function(done) {
      client = DynamoDB.client;
      DynamoDB.createProduct({id : "DeleteMe", foo: "Bar"}, done);
    });

    it('should delete an item', function(done) {
      client.deleteItem(DynamoDB.TestTable, "DeleteMe", function(err, resp) {
        should.exist(resp.ConsumedCapacityUnits);
        done(err);
      });

    });

    it('should delete an item and return its old values', function(done) {
      client.deleteItem(DynamoDB.TestTable, "DeleteMe", {ReturnValues: "ALL_OLD"}, function(err, resp) {
        resp.Attributes.should.eql({ foo: 'Bar', id: 'DeleteMe' });
        done(err);
      });
    });

  });
});