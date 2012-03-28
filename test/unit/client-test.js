var Client = require("../../lib/dynode/client").Client,
    util = require('utile'),
    should = require('should');

describe("DynamoDB Client unit tests", function(){
  var realRequest,
      client;

  beforeEach(function() {
    client = new Client({accessKeyId :"MockId", secretAccessKey: "MockKey"});
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

        cb();
      };

      client.createTable("CreateThisTable", done);
    });

    it('should create table with custom read and write throughput', function(done) {
      client._request = function(action, options, cb) {
        options.ProvisionedThroughput.should.eql({ ReadCapacityUnits: 4, WriteCapacityUnits: 3 });
        cb();
      };

      client.createTable("TestTable", {read: 4, write: 3}, done);
    });

    it('should create table with custom keys', function(done) {
      client._request = function(action, options, cb) {
        options.KeySchema.HashKeyElement.should.eql({ AttributeName: 'age', AttributeType: 'N' });
        options.KeySchema.RangeKeyElement.should.eql({ AttributeName: 'name', AttributeType: 'S' });
        cb();
      };

      client.createTable("TestTable", {hash:{age: Number}, range: {name: String}}, done);
    });
  });

  describe("Describe Table", function() {
    it('should make describe table request', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("DescribeTable");
        options.TableName.should.equal("TestTable");

        cb(null, {});
      };

      client.describeTable("TestTable", done);
    });
  });

  describe("List Tables", function() {
    it('should make request to list all tables', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("ListTables");
        options.should.eql({});
        cb();
      };

      client.listTables(done);
    });

    it('should make request with given options', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("ListTables");
        options.should.eql({Limit: 4, ExclusiveStartTableName: "SomeTable"});

        cb();
      };

      client.listTables({Limit: 4, ExclusiveStartTableName: "SomeTable"}, done);
    });
  });

  describe("Delete Table", function() {
    it('should delete the table', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("DeleteTable");
        options.TableName.should.equal("TableToDelete");

        cb();
      };

      client.deleteTable("TableToDelete", done);
    });

  });

  describe("Update Table", function() {
    it('should update tables provisioned throughput ', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("UpdateTable");
        options.TableName.should.equal("UpdateThisTable");
        options.ProvisionedThroughput.should.eql({ ReadCapacityUnits: 5, WriteCapacityUnits: 2 });

        cb();
      };

      client.updateTable("UpdateThisTable",  {read: 5, write: 2}, done);
    });
  });

  describe("Put Item", function() {
    it('should make request to save simple item', function(done) {
      var item = {id : "Foo", age : 22};

      client._request = function(action, options, cb) {
        action.should.equal("PutItem");
        options.TableName.should.equal("TestTable");
        options.Item.should.eql({id: { S: 'Foo' }, age: { N: '22' } });

        cb();
      };

      client.putItem("TestTable", item, done);
    });

    it('should make request to save complex item', function(done) {
      var item = {id : 99, nums : [22, 33, 44], terms : ["foo", "bar", "baz"]};

      client._request = function(action, options, cb) {
        action.should.equal("PutItem");
        options.TableName.should.equal("TestTable");

        options.Item.should.eql({
          id    : { N: '99' },
          nums  : { NS: ['22', '33', '44']},
          terms : { SS: ["foo", "bar", "baz"]}
        });

        cb();
      };

      client.putItem("TestTable", item, done);
    });

    it('should make request with given options', function(done) {
      var item = {id : "blah"};

      client._request = function(action, options, cb) {
        action.should.equal("PutItem");
        options.TableName.should.equal("TestTable");
        options.ReturnValues.should.equal("ALL_OLD");
        options.Item.should.eql({id: { S: 'blah' }});

        cb();
      };

      client.putItem("TestTable", item,{ReturnValues:"ALL_OLD"}, done);
    });

  });

  describe("Update Item", function() {
    it('should make request to update item', function(done) {
      var updates = {age : 22};

      client._request = function(action, options, cb) {
        action.should.equal("UpdateItem");
        options.TableName.should.equal("TestTable");
        options.Key.should.eql({HashKeyElement: { S :"My-Key"}});

        options.AttributeUpdates.should.eql({"age":{"Value":{"N":"22"},"Action":"PUT"}});

        cb(null, {ConsumedCapacityUnits: 1});
      };

      client.updateItem("TestTable", "My-Key", updates, done);
    });

    it('should make request to update item by composite key', function(done) {
      var updates = {age : 22};

      client._request = function(action, options, cb) {
        action.should.equal("UpdateItem");
        options.TableName.should.equal("TestTable");
        options.Key.should.eql({HashKeyElement: { S :"My-Key"}, RangeKeyElement: { N :"123"} });

        cb(null, {ConsumedCapacityUnits: 1});
      };

      client.updateItem("TestTable", {hash: "My-Key",range: 123} , updates, done);
    });

    it('should mix in options to the request', function(done) {
      var updates = {age : 22},
      opts = {"Expected":{"foo":{"Value":{"S":"bar"}}}};

      client._request = function(action, options, cb) {
        action.should.equal("UpdateItem");
        options.TableName.should.equal("TestTable");
        options.Expected.should.eql({"foo":{"Value":{"S":"bar"}}});

        cb(null, {ConsumedCapacityUnits: 1});
      };

      client.updateItem("TestTable", "somekey" , updates, opts, done);
    });

    it('should parse returned Attributes to json', function(done) {
      var updates = {age : 22};

      client._request = function(action, options, cb) {
        cb(null, {ConsumedCapacityUnits: 1,
                  Attributes : {
                    name : {"S":"Bob"}, age : {"N":"22"}
                  }
        });
      };

      client.updateItem("TestTable", "somekey" , updates, function(err, meta){
        meta.Attributes.name.should.equal("Bob");
        meta.Attributes.age.should.equal(22);

        done();
      });

    });

	it('should handle errors from client._request', function(done) {
      var updates = { friends : ["paul", "john", "ringo", "george", "paul"] };
	  var awsError = new Error("One or more parameter values were invalid: Input collection friends contains duplicates.");

      client._request = function(action, options, cb) {
        cb(awsError);
      };

      client.updateItem("TestTable", "somekey" , updates, function(err, meta) {
        should.not.exist(meta);
        should.exist(err);
        err.should.equal(awsError);

        done();
      });

    });

  });

  describe("Get Item", function() {

    it("should get item by hash key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("GetItem");
        options.Key.should.eql({HashKeyElement: { S :"somekey"}});

        done();
      };

      client.getItem("TestTable", "somekey", done);

    });

    it("should get item by composite key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("GetItem");
        options.Key.should.eql({HashKeyElement: { N :"123"}, RangeKeyElement: { S :"blah"} });

        done();
      };

      client.getItem("TestTable", {hash: 123, range: "blah"}, done);

    });

    it("should make request with given options", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("GetItem");
        options.Key.should.eql({HashKeyElement: { S :"somekey"}});
        options.ConsistentRead.should.be.true;
        options.AttributesToGet.should.eql(["name", "age"]);

        done();
      };

      client.getItem("TestTable", "somekey",{ConsistentRead: true, "AttributesToGet":["name","age"],}, done);

    });

  });

  describe("Delete Item", function() {

    it("should make request to delete item by hash key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("DeleteItem");
        options.Key.should.eql({HashKeyElement: { S :"somekey"}});

        done();
      };

      client.deleteItem("TestTable", "somekey", done);

    });

    it("should make request to delete item by composite key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("DeleteItem");
        options.Key.should.eql({HashKeyElement: { S :"somekey"}, RangeKeyElement: { S :"foo"}});

        done();
      };

      client.deleteItem("TestTable", {hash: "somekey", range: "foo"}, done);
    });

    it("should make request to delete item with options", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("DeleteItem");
        options.Key.should.eql({HashKeyElement: { S :"somekey"}});
        options.ReturnValues.should.equal("ALL_OLD");

        done();
      };

      client.deleteItem("TestTable", "somekey",{ReturnValues : "ALL_OLD"}, done);

    });
  });

  describe("Query", function() {
    it("should make query request with string hash key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("Query");
        options.TableName.should.eql("QueryTable");
        options.HashKeyValue.should.eql({"S":"my-key"});

        cb(null, {});
      };

      client.query("QueryTable", "my-key", done);
    });

    it("should make query request with number hash key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("Query");
        options.TableName.should.eql("QueryTable");
        options.HashKeyValue.should.eql({"N":"33"});

        done();
      };

      client.query("QueryTable", 33);
    });

    it("should make query request with options", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("Query");
        options.TableName.should.eql("QueryTable");
        options.RangeKeyCondition.should.eql({"AttributeValueList":[{"N":"AttributeValue2"}],"ComparisonOperator":"GT"});
        options.Limit.should.equal(13);

        cb();
      };

      client.query("QueryTable", "thiskey",{Limit: 13,RangeKeyCondition: {AttributeValueList:[{"N":"AttributeValue2"}],"ComparisonOperator":"GT"}}, done );
    });

  });

  describe("Scan", function() {
    it("should make scan request with options", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("Scan");
        options.TableName.should.eql("TestTable");
        options.Limit.should.equal(2);

        cb(null, {});
      };

      client.scan("TestTable", {Limit : 2}, done);
    });

    it("should convert returned items to json", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("Scan");
        options.TableName.should.eql("TestTable");

        cb(null, {Items: [{"name":{"S":"Ryan"}}, {"name":{"S":"Bob"}}] });
      };

      client.scan("TestTable", {Limit : 2}, function(err, items) {
        items.should.have.lengthOf(2);
        items[0].should.eql({name: "Ryan"});
        items[1].should.eql({name: "Bob"});
        done();
      });

    });

  });

  describe("BatchGetItem", function() {
    it("should make batch item request with given keys", function(done){
      client._request = function(action, options, cb) {
        var request = options.RequestItems;
        action.should.equal("BatchGetItem");

        request.BatchTable.Keys.should.eql([{"HashKeyElement": {"S":"blah"}}, {"HashKeyElement": {"S":"moreBlah"}} ]);
        request.AnotherTable.Keys.should.eql([{"HashKeyElement": {"S":"anotherKey"}, "RangeKeyElement":{"N":"123"}} ]);

        cb(null, {});
      };

      var options = {
        "BatchTable": {keys:[{hash: "blah"}, {hash: "moreBlah"}]},
        "AnotherTable": {keys:[{hash: "anotherKey", range: 123}]}
      }

      client.batchGetItem(options, done);
    });

    it("should make batch item request with AttributesToGet", function(done){
      client._request = function(action, options, cb) {
        var request = options.RequestItems;
        action.should.equal("BatchGetItem");

        request.BatchTable.Keys.should.eql([{"HashKeyElement": {"S":"blah"}}]);
        request.BatchTable.AttributesToGet.should.eql(["name", "age"]);

        request.AnotherTable.Keys.should.eql([{"HashKeyElement": {"S":"anotherKey"}} ]);
        should.not.exist(request.AnotherTable.AttributesToGet);

        cb(null, {});
      };

      var options = {
        "BatchTable": {keys:[{hash: "blah"}], AttributesToGet : ["name", "age"]},
        "AnotherTable": {keys:[{hash: "anotherKey"}]}
      }

      client.batchGetItem(options, done);
    });

    it("should parse returned response to json", function(done){
      var response = {
        Responses :{
          Table1 : {
            Items:[
              {"name": {"S":"Bob"},"Age": {"N":"22"} },
              {"name": {"S":"Dan"},"Age": {"N":"66"} }
            ],
            ConsumedCapacityUnits : 1
          },
          Table2 : {
            Items:[
              {"brand": {"S":"Nike"},"price": {"N":"33.99"} },
              {"brand": {"S":"Adidas"},"price": {"N":"22.99"} }
            ],
            ConsumedCapacityUnits : 4
          }
        }};

      client._request = function(action, options, cb) {
        cb(null, response);
      };

      var options = {
        "Table1": {keys:[{hash: "blah"}, {hash: "moreBlah"}]},
        "Table2": {keys:[{hash: "anotherKey", range: 123}]}
      }

      client.batchGetItem(options, function(err, resp, meta){
        resp.Table1.should.have.lengthOf(2);
        resp.Table1[0].should.eql({name: 'Bob', Age: 22});
        resp.Table1[1].should.eql({name: 'Dan', Age: 66});

        resp.Table2.should.have.lengthOf(2);
        resp.Table2[0].should.eql({brand: 'Nike', price: 33.99});
        resp.Table2[1].should.eql({brand: 'Adidas', price: 22.99});

        meta.ConsumedCapacityUnits.Table1.should.equal(1);
        meta.ConsumedCapacityUnits.Table2.should.equal(4);

        done();
      });
    });

  });

});