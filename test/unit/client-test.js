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

      client.createTable("CreateThisTable", function(err, table) {});
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

  describe("Delete Table", function() {
    var realRequest;

    before(function() {
      client = DynamoDB.client;
      realRequest = client._request;
    });

    after(function() {
      client._request = realRequest;
    });

    it('should delete the table', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("DeleteTable");
        options.TableName.should.equal("TableToDelete");

        done();
      };

      client.deleteTable("TableToDelete", function(err, table) {});
    });

  });

});