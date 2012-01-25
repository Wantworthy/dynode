var Client = require("../../lib/dynode/client").Client,
    DynamoDB = require('../test-helper'),
    util = require('utile'),
    should = require('should');

describe("DynamoDB Client unit tests", function(){
  var realRequest,
      client;

  beforeEach(function() {
    client = DynamoDB.client;
    realRequest = client._request;
  });

  afterEach(function() {
    client._request = realRequest;
  });

  describe("Create Table", function() {

    it('should create table with defaults', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("CreateTable");
        options.TableName.should.equal("CreateThisTable");
        options.KeySchema.HashKeyElement.should.eql({ AttributeName: 'id', AttributeType: 'S' });
        options.ProvisionedThroughput.should.eql({ ReadCapacityUnits: 10, WriteCapacityUnits: 5 });

        done();
      };

      client.createTable("CreateThisTable", function(err, table){});
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

  describe("Describe Table", function() {
    it('should make describe table request', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("DescribeTable");
        options.TableName.should.equal("TestTable");

        done();
      };

      client.describeTable("TestTable", function(err, table) {});
    });
  });  
  
  describe("List Tables", function() {
    it('should make request to list all tables', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("ListTables");
        options.should.eql({});
        done();
      };

      client.listTables(function(err, table) {});
    });

    it('should make request with given options', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("ListTables");
        options.should.eql({Limit: 4, ExclusiveStartTableName: "SomeTable"});
        done();
      };

      client.listTables({Limit: 4, ExclusiveStartTableName: "SomeTable"}, function(err, table) {});
    });
  });

  describe("Delete Table", function() {
    it('should delete the table', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("DeleteTable");
        options.TableName.should.equal("TableToDelete");

        done();
      };

      client.deleteTable("TableToDelete", function(err, table) {});
    });

  });

  describe("Update Table", function() {
    it('should update tables provisioned throughput ', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("UpdateTable");
        options.TableName.should.equal("UpdateThisTable");
        options.ProvisionedThroughput.should.eql({ ReadCapacityUnits: 5, WriteCapacityUnits: 2 });

        done();
      };

      client.updateTable("UpdateThisTable",  {read: 5, write: 2}, function(err, table) {});
    });

  });

});