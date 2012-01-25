var Client = require("../lib/dynode/client").Client,
    DynamoDB = require('./test-helper'),
    util = require('utile'),
    should = require('should');

describe('DynamoDB Client', function() {
  var client;

  describe("Tables", function() {

    before(function(){
      client = new Client({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
    });

    it('should list all tables', function(done) {

      client.listTables({}, function(err, tables) {
        tables.should.have.property("TableNames");
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

  describe("Create Table", function() {
    var realRequest;

    before(function() {
      client = DynamoDB.client;
      realRequest = client._request;
    });

    after(function(){
      client._request = realRequest;
    });

    it('should create table with defaults', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("CreateTable");
        options.KeySchema.HashKeyElement.should.eql({ AttributeName: 'id', AttributeType: 'S' });
        options.ProvisionedThroughput.should.eql({ ReadCapacityUnits: 10, WriteCapacityUnits: 5 });

        done();
      };

      client.createTable("TestTable", function(err, table) {});
    });

    it('should create table with custom read and write throughput', function(done) {
      client._request = function(action, options, cb) {
        options.ProvisionedThroughput.should.eql({ ReadCapacityUnits: 4, WriteCapacityUnits: 3 });
        done();
      };

      client.createTable("TestTable", {read: 4, write: 3}, function(err, table) {});
    });

    it('should create table with custom keys', function(done) {
      client._request = function(action, options, cb) {
        options.KeySchema.HashKeyElement.should.eql({ AttributeName: 'age', AttributeType: 'N' });
        options.KeySchema.RangeKeyElement.should.eql({ AttributeName: 'name', AttributeType: 'S' });
        done();
      };

      client.createTable("TestTable", {hash:{age: Number}, range: {name: String}}, function(err, table) {});
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