var Client = require("../../lib/dynode/client").Client,
    util = require('utile'),
    should = require('chai').should();

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

    it('should handle null metadata', function(done) {
      var updates = {age : 22};

      client._request = function(action, options, cb) {
        action.should.equal("UpdateItem");
        options.TableName.should.equal("TestTable");
        options.Key.should.eql({HashKeyElement: { S :"My-Key"}, RangeKeyElement: { N :"123"} });

        cb(null, null);
      };

      client.updateItem("TestTable", {hash: "My-Key",range: 123} , updates, done);
    });

    it('should parse nulls into delete statements', function(done) {
      var updates = {age : null, nums : []};

      client._request = function(action, options, cb) {
        action.should.equal("UpdateItem");
        options.TableName.should.equal("TestTable");
        options.Key.should.eql({HashKeyElement: { S :"My-Key"}});
        options.AttributeUpdates.should.eql({"age":{"Action":"DELETE"}, "nums":{"Action":"DELETE"}});

        cb(null, null);
      };

      client.updateItem("TestTable", "My-Key" , updates, done);
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

    it("should return null when item for given key doesnt exist", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("GetItem");
        
        cb(null, {Item : {}});
      };

      client.getItem("TestTable", "doesnt-exist-key", function(err, item){
        should.not.exist(item);
        done();
      });
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

    it("should convert returned items to json", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("Query");
        options.TableName.should.eql("QueryTable");
        options.HashKeyValue.should.eql({"N":"12345"});

        cb(null, 
          { ConsumedCapacityUnits: 0.5, Count: 2, Items:
            [ { name: { S: 'bday' }, accountID: { N: '12345' } },
              { name: { S: 'summer' }, accountID: { N: '12345' } } ] });
      };

      client.query("QueryTable", 12345, function (err, resp) {
        should.not.exist(err);

        resp.Items[0].should.eql({name : 'bday', accountID: 12345});
        resp.Items[1].should.eql({name : 'summer', accountID: 12345});
        done()
      });
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
        
        cb(null, {});
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

  describe("BatchWriteItem", function() {
    it("should make batch item request with given keys", function(done){
      client._request = function(action, options, cb) {
        var request = options.RequestItems;
        action.should.equal("BatchWriteItem");

        request.BatchTable[0].should.eql({PutRequest : {"Item" : {id : {'S' : 'foo'}, name : {'S' : 'bar'} } }});
        request.BatchTable[1].should.eql({DeleteRequest : {"Key" : {HashKeyElement : {'S' : 'hash-key'}} }});

        request.AnotherTable[0].DeleteRequest.should.eql({"Key" : {HashKeyElement : {'S' : 'somekey'}, RangeKeyElement : {'S' : 'foo'}} });
        request.AnotherTable[1].DeleteRequest.should.eql({"Key" : {HashKeyElement : {'S' : 'another key'}, RangeKeyElement : {'S' : 'moar foo'}} });

        cb(null, {});
      };

      var options = {
        "BatchTable": [
          {put : {id : "foo", name: "bar"}},
          {del : "hash-key"}
        ],
        "AnotherTable": [
          {del : {hash: "somekey", range: "foo"}},
          {del : {hash: "another key", range: "moar foo"}}
        ]
      };

      client.batchWriteItem(options, done);
    });

  });
  describe("Table Name Prefix", function() {
    var prefixClient,mockRequest;

    beforeEach(function() {
      prefixClient = new Client({accessKeyId :"MockId", secretAccessKey: "MockKey", tableNamePrefix : "Test_"});
      mockRequest = prefixClient.request = {};
    });

    it('should prefix table name for put item request', function(done) {
      mockRequest.send = function(action, options, cb) {
        action.should.equal("PutItem");
        options.TableName.should.equal("Test_SomeTable");
        cb();
      };

      prefixClient.putItem("SomeTable", {id : "Foo", age : 22}, done);
    });

    it('should prefix table name for update item request', function(done) {
      mockRequest.send = function(action, options, cb) {
        action.should.equal("UpdateItem");
        options.TableName.should.equal("Test_SomeTable");
        cb();
      };

      prefixClient.updateItem("SomeTable", "My-Key", {age : 22}, done);
    });

    it('should prefix table name for get item request', function(done) {
      mockRequest.send = function(action, options, cb) {
        action.should.equal("GetItem");
        options.TableName.should.equal("Test_SomeTable");
        done();
      };

      prefixClient.getItem("SomeTable", "My-Key");
    });

    it("should prefix table name for delete item request", function(done){
      mockRequest.send = function(action, options, cb) {
        action.should.equal("DeleteItem");
        options.TableName.should.equal("Test_SomeTable");
        cb(null, {});
      };

      prefixClient.deleteItem("SomeTable", "somekey", done);
    });

    it("should prefix table name for query request", function(done){
      mockRequest.send = function(action, options, cb) {
        action.should.equal("Query");
        options.TableName.should.equal("Test_QueryTable");
        done();
      };

      prefixClient.query("QueryTable", "somekey");
    });

    it("should prefix table name for scan request", function(done){
      mockRequest.send = function(action, options, cb) {
        action.should.equal("Scan");
        options.TableName.should.equal("Test_ScanTable");
        done();
      };

      prefixClient.scan("ScanTable", {Limit : 2});
    });

    it("should prefix table name for batch get item request", function(done){
      mockRequest.send = function(action, options, cb) {
        var request = options.RequestItems;
        action.should.equal("BatchGetItem");
        Object.keys(request).should.eql(['Test_BatchTable', 'Test_AnotherBatchTable']);

        request.Test_BatchTable.Keys.should.eql([{"HashKeyElement": {"S":"blah"}}, {"HashKeyElement": {"S":"moreBlah"}} ]);
        request.Test_AnotherBatchTable.Keys.should.eql([{"HashKeyElement": {"S":"anotherKey"}, "RangeKeyElement":{"N":"123"}} ]);
        done();
      };

      var options = {
        "BatchTable": {keys:[{hash: "blah"}, {hash: "moreBlah"}]},
        "AnotherBatchTable": {keys:[{hash: "anotherKey", range: 123}]}
      };

      prefixClient.batchGetItem(options);
    });

    it("should prefix table name for batch write item request", function(done){
      mockRequest.send = function(action, options, cb) {
        var request = options.RequestItems;
        action.should.equal("BatchWriteItem");
        Object.keys(request).should.eql(['Test_BatchTable', 'Test_AnotherBatchTable']);

        done();
      };

      var options = {
        "BatchTable": [{put : {id : "foo", name: "bar"}},{del : "hash-key"}],
        "AnotherBatchTable": [{del : "anotherkey"}]
      };

      prefixClient.batchWriteItem(options);
    });

    it("should prefix table name for create table request", function(done){
      mockRequest.send = function(action, options, cb) {
        action.should.equal("CreateTable");
        options.TableName.should.equal("Test_CreateThisTable");
        done();
      };

      prefixClient.createTable("CreateThisTable", done);
    });

    it("should prefix table name for update table request", function(done){
      mockRequest.send = function(action, options, cb) {
        action.should.equal("UpdateTable");
        options.TableName.should.equal("Test_UpdateThisTable");
        cb();
      };

      prefixClient.updateTable("UpdateThisTable", {read: 5, write: 2}, done);
    });

    it("should prefix table name for delete table request", function(done){
      mockRequest.send = function(action, options, cb) {
        action.should.equal("DeleteTable");
        options.TableName.should.equal("Test_DeleteThisTable");
        cb();
      };

      prefixClient.deleteTable("DeleteThisTable", done);
    });

    it("should prefix table name for describe table request", function(done){
      mockRequest.send = function(action, options, cb) {
        action.should.equal("DescribeTable");
        options.TableName.should.equal("Test_DescribeThisTable");
        cb(null, {});
      };

      prefixClient.describeTable("DescribeThisTable", done);
    });

    it("should prefix table name for list tables request", function(done){
      mockRequest.send = function(action, options, cb) {
        action.should.equal("ListTables");
        options.should.eql({Limit: 4, ExclusiveStartTableName: "Test_SomeTable"});
        cb();
      };

      prefixClient.listTables({Limit: 4, ExclusiveStartTableName: "SomeTable"}, done);
    });

  });

  describe("Remove Table Name Prefix", function(){
    var prefixClient,mockRequest;

    beforeEach(function() {
      prefixClient = new Client({accessKeyId :"MockId", secretAccessKey: "MockKey", tableNamePrefix : "Test_"});
      mockRequest = prefixClient.request = {};
    });

    it("strips unprocessed items table names", function(){
      var resp = {
        "Responses":{"Test_Thread":{"ConsumedCapacityUnits":1.0},"Test_Reply":{"ConsumedCapacityUnits":1.0}},
        "UnprocessedItems":{
          "Test_Reply":[{"DeleteRequest":{"Key":{"HashKeyElement":{"S":"Amazon DynamoDB#DynamoDB Thread 4"}}}}]
        }
      }

      var stripped = prefixClient._removeTableNamePrefix(resp);
      stripped.Responses.should.eql({"Thread":{"ConsumedCapacityUnits":1.0},"Reply":{"ConsumedCapacityUnits":1.0}});
      stripped.UnprocessedItems.Reply.should.eql([{"DeleteRequest":{"Key":{"HashKeyElement":{"S":"Amazon DynamoDB#DynamoDB Thread 4"}}}}]);
    });
  });
});

