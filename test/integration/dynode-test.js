var dynode = require("../../lib/dynode"),
    DynamoDB = require('../test-helper'),
    util = require('utile'),
    should = require('should');

describe('Dynode Integration Tests', function() {

  beforeEach(function() {
    dynode.auth({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
  });

  describe("Tables", function() {

    it('should list all tables', function(done) {

      dynode.listTables({}, function(err, tables) {
        tables.should.have.property("TableNames");
        done();
      });

    });

    it('should describe table', function(done) {
      
      dynode.describeTable("TestTable", function(err, table) {
        table.TableName.should.equal("TestTable");
        done();
      });

    });

  });

  describe("Put Item", function() {

    it('should create new item', function(done) {
      dynode.putItem("TestTable", {id : "Blah", foo: "Bar", num: 123, baz : ["a", "b", "c"]}, function(err, resp) {
        done(err);   
      });

    });
  });

  describe("Get Item", function() {
    
    before(function(done) {
      DynamoDB.createProduct({id : "TestItem", foo: "Bar"}, done);
    });

    it('should get item', function(done) {
      dynode.getItem("TestTable", "TestItem", function(err, item, meta) {
        item.should.eql({id : "TestItem", foo: "Bar"});
        meta.ConsumedCapacityUnits.should.equal(0.5);
        done(err);
      });

    });
  });

  describe("Scan", function() {
    
    before(function(done) {
      DynamoDB.createProducts(DynamoDB.products, done);
    });

    it('should get all items', function(done) {
      dynode.scan(DynamoDB.TestTable, function(err, items, meta) {
        items.should.have.length(meta.Count);
        done(err);
      });

    });

    it('should accept limit filter', function(done) {
      dynode.scan(DynamoDB.TestTable,{Limit: 2}, function(err, items, meta) {
        items.should.have.length(2);
        meta.Count.should.equal(2);
        done(err);
      });

    });

  });

  describe("Delete Item", function() {
    
    beforeEach(function(done) {
      DynamoDB.createProduct({id : "DeleteMe", foo: "Bar"}, done);
    });

    it('should delete an item', function(done) {
      dynode.deleteItem(DynamoDB.TestTable, "DeleteMe", function(err, resp) {
        should.exist(resp.ConsumedCapacityUnits);
        done(err);
      });

    });

    it('should delete an item and return its old values', function(done) {
      dynode.deleteItem(DynamoDB.TestTable, "DeleteMe", {ReturnValues: "ALL_OLD"}, function(err, resp) {
        resp.Attributes.should.eql({ foo: 'Bar', id: 'DeleteMe' });
        done(err);
      });
    });

  });
});