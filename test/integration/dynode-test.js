var dynode = require("../../lib/dynode"),
    DynamoDB = require('../test-helper'),
    util = require('utile'),
    should = require('chai').should();

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
        should.not.exist(err);
        done();
      });
    });

    it('should create item with unicode characters', function(done) {
      dynode.putItem("TestTable", {id : "another", uni: "München"}, function(err, resp) {
        should.not.exist(err);
        done(err);
      });
    });

    it('should create item without empty string attributes', function(done) {
      dynode.putItem("TestTable", {id : "more", name :"", strings: [""], count: 0 }, function(err, resp) {
        should.not.exist(err);

        dynode.getItem("TestTable", "more", {ConsistentRead : true}, function(err, item){
          should.not.exist(err);
          should.not.exist(item.name);
          should.not.exist(item.strings);

          item.should.eql({id : 'more', count : 0});
          done(err);
        });

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

    it('should return null for not found item', function(done) {
      dynode.getItem("TestTable", "ThisKeyDoesntExist", function(err, item, meta) {
        should.not.exist(err);
        should.not.exist(item);
        meta.ConsumedCapacityUnits.should.equal(0.5);
        done(err);
      });
    });
  });

  describe("Update Item", function() {

    before(function(done) {
      DynamoDB.createProducts([
        {id: "updateTest", foo: "baz"}, 
        {id: "update2", nums: [1,2,3], age: 22},
        {id: "update3", foo: "bar", age: 22},
        {id: "update4", foo: "blah", age: 99, nums : [4,5,6], lname : 'tester'}
      ], done);
    });

    it('should update existing item and return its new values', function(done) {
      dynode.updateItem(DynamoDB.TestTable, "updateTest", {foo: "Bar"}, {ReturnValues: "UPDATED_NEW"}, function(err, resp) {
        resp.Attributes.should.eql({ foo: 'Bar' });
        done(err);
      });
    });

    it('should update existing Item by adding a number to a set of numbers', function(done) {
      dynode.updateItem(DynamoDB.TestTable, "update2", {nums: {add : [5]}, age: {add: 2}}, {ReturnValues: "UPDATED_NEW"}, function(err, resp) {
        var nums = resp.Attributes.nums.sort();
        nums.should.eql([1, 2, 3, 5]);
        resp.Attributes.age.should.eql(24);
        done(err);
      });
    });

    it('should delete age attribute', function(done) {
      dynode.updateItem(DynamoDB.TestTable, "update3", {age: {'Action' : "DELETE"}}, {ReturnValues: "ALL_NEW"}, function(err, resp) {
        resp.Attributes.should.eql({ id: 'update3', foo: 'bar' });
        should.not.exist(resp.Attributes.age);
        done(err);
      });
    });

    it('should delete attributes', function(done) {
      dynode.updateItem(DynamoDB.TestTable, "update4", {age: null, nums : [], lname : ''}, {ReturnValues: "ALL_NEW"}, function(err, resp) {
        resp.Attributes.should.eql({ id: 'update4', foo: 'blah' });
        should.not.exist(resp.Attributes.age);
        should.not.exist(resp.Attributes.nums);
        should.not.exist(resp.Attributes.lname);
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

  describe("Batch Write Item", function(){
    before(function(done) {
      DynamoDB.createProducts([
        {id: "batch1", foo: "baz"}, 
        {id: "batch2", nums: [1,2,3], age: 22},
        {id: "batch3", foo: "bar", age: 22},
        {id: "batch4", foo: "blah", age: 99, nums : [4,5,6], lname : 'tester'}
      ], done);
    });

    it("should update all items", function(done){
      var writes = {};
      writes[DynamoDB.TestTable] = [
        {put : {id : "batch1", foo: "new foo"}},
        {del : "batch2"},
        {del : "batch3"}
      ];

      dynode.batchWriteItem(writes, function(err, resp){
        should.not.exist(err);
        done();
      });

    });
  });
  describe("Truncate", function(){
    before(function(done) {
      this.timeout(0);
      var products = [];
      
      for(var i = 0; i <= 10; i++) {
        products.push({id: "prod-"+i, foo: "bar-" +i});
      }

      DynamoDB.createProducts(products, done);
    });

    it("should remove all items from table", function(done){
      this.timeout(0);

      dynode.truncate(DynamoDB.TestTable, function(err){

        dynode.getItem(DynamoDB.TestTable, 'prod-10', {ConsistentRead : true}, function(err, item){
          should.not.exist(err);
          should.not.exist(item);
          done();
        });
      });
    });
  });

  describe("Error Handling", function(){

    it("should return error for non existant table", function(done) {
      
      dynode.describeTable("NonExistTable", function(err) {
        err.type.should.equal("ResourceNotFoundException");

        done();
      });

    });
  });

  describe('HTTPS', function(){

    before(function(done){
      dynode.auth({
        https : true,
        accessKeyId: process.env.AWS_ACCEESS_KEY_ID, 
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      });

      DynamoDB.createProducts(DynamoDB.products, done);
    });

    it("should use https when passing setting https to true in config", function(done){
      dynode.scan(DynamoDB.TestTable, function(err, items, meta) {
        items.should.have.length(meta.Count);
        done(err);
      });
    });
  });

});