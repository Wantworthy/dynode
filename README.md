# dynode [![Build Status](https://secure.travis-ci.org/Wantworthy/dynode.png)](http://travis-ci.org/Wantworthy/dynode)
node.js client for working with Amazon's [DynamoDB](http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/Introduction.html?r=5378) service.

## Installation

### Installing npm (node package manager)
``` bash
  $ curl http://npmjs.org/install.sh | sh
```

### Installing dynode
``` bash 
  $ [sudo] npm install dynode
```
## Motivation
Dynode is designed to be a simple and easy way to work with Amazon's DynamoDB service. Amazon's http api is complicated and non obvious how to interact with it. This client aims to offer a simplified more obvious way of working with DynamoDB, but without getting in your way or limiting what you can do with DynamoDB.

## Usage
There are two different ways to use dynode: directly via the default dynamoDB client, or by instantiating your own client. The former is merely intended to be a convenient shared client to use throughout your application if you so choose.

### Using the Default DynamoDB Client
The default client is accessible through the dynode module directly. Any method that you could call on an instance of a client is available on the default client:

``` js
  var dynode = require('dynode');
  // When using the default client you must first give it auth credentials
  dynode.auth({accessKeyId: "AWSAccessKey", secretAccessKey: "SecretAccessKey"});

  dynode.createTable("NewTable", console.log);
  dynode.listTables(console.log);
```

### Instantiating your own DynamoDB Client
If you would prefer to manage your own client, potentially with different auth params:

``` js
  var client = new (dynode.Client)({
    accessKeyId: "AWSAccessKey", secretAccessKey: "SecretAccessKey"
  });
```
## Callback Signature
Callbacks return (error, [results], meta) where results are the returned data and meta is the extra information returned by DynamoDB

## API Documentation

* [Auth](#auth)
* [Table Name Prefix](#tableNamePrefix)
* [HTTPS](#https)
* [Create Table](#createTable)
* [List Tables](#listTables)
* [Describe Table](#describeTable)
* [updateTable](#updateTable)
* [deleteTable](#deleteTable)
* [Put Item](#putItem)
* [Update Item](#updateItem)
* [Get Item](#getItem)
* [Delete Item](#deleteItem)
* [Query](#query)
* [Scan](#scan)
* [Batch Get Item](#batchGetItem)
* [Batch Write Item](#batchWriteItem)
* [Truncate](#truncate)

<a name="auth"></a>
## Auth

Before you can perform any operations on DynamoDB you need to provide your Amazon credentials.

``` js
  dynode.auth({accessKeyId: "AWSAccessKey", secretAccessKey: "SecretAccessKey"});
```

<a name="tableNamePrefix"></a>
## Table Name Prefix

dynode client takes an optional tableNamePrefix in order to support running in different environments such as dev, testing, production  

``` js
  var client = new (dynode.Client)({
    accessKeyId: "AWSAccessKey", secretAccessKey: "SecretAccessKey", tableNamePrefix: "Dev_"
  });
```

Now all operations will be performed against tables starting with that prefix, for example

``` js
  client.createTable("NewTable", console.log); // will create table named 'Dev_NewTable'
```

<a name="https"></a>
## HTTPS

To use HTTPS for connecting to DynamoDB pass in the https option, by default dynode will use HTTP

``` js
  dynode.auth({https: true, accessKeyId: "AWSAccessKey", secretAccessKey: "SecretAccessKey"});
```

<a name="createTable"></a>
## Create Table
The CreateTable operation adds a new table to your account. For more info see [here][createTablesDocs]

By default `createTable` will create the given table with a primary key of id : String, a read capacity of 10 and write capacity of 5.

``` js
  dynode.createTable("ExampleTable", console.log);
```

`createTable` accepts an options hash to override any of the table creation defaults.

``` js
  var opts = {read: 20, write: 25, hash: {name: String}, range: {age: Number}};
  dynode.createTable("ExampleTable", opts, console.log);
```

<a name="listTables"></a>
## List Tables
Returns an array of all the tables associated with the current account. For more info see [here][listTablesDocs]

By default `listTables` will list all of your DynamoDB tables.

``` js
  dynode.listTables(console.log);
```

You can also pass in options to filter which tables to list. See [Amazon's docs][listTablesDocs] for more info 

``` js
  dynode.listTables({Limit: 3, ExclusiveStartTableName: "ExampleTable"}, console.log);
```

<a name="describeTable"></a>
## Describe Table

Returns information about the table, including the current status of the table, the primary key schema and when the table was created. 
For more info see [here][describeTableDocs]

``` js
  dynode.describeTable("ExampleTable", function (error, info));
```

<a name="updateTable"></a>
## Update Table

Updates the provisioned throughput for the given table. For more info see [here][updateTableDocs]

``` js
  dynode.updateTable("ExampleTable", {read: 15, write: 10}, console.log);
```

<a name="deleteTable"></a>
## Delete Table

Deletes a table and all of its items. For more info see [here][deleteTableDocs]

``` js
  dynode.deleteTable("ExampleTable", console.log);
```

<a name="putItem"></a>
## Put Item
Creates a new item, or replaces an old item with a new item (including all the attributes). For more info see [here][putItemDocs]

``` js
  dynode.putItem("ExampleTable", {name : "Foo", age: 80, baz : ["a", "b", "c"], nums: [1,2,3]}, console.log);
```

You can also pass in any option that Amazon accepts.

``` js
  var item = {name : "Bob"};
  var options = {ReturnValues:"ReturnValuesConstant", Expected :{"age":{"Value": {"N":"42"},{"Exists":Boolean}}}};

  dynode.putItem("ExampleTable", item, options, console.log);
```

<a name="updateItem"></a>
## Update Item
Edits an existing item's attributes. For more info see [here][updateItemDocs]

By default all operations will be a PUT, which will add or replace the attribute with the new value.

``` js
  dynode.updateItem("ExampleTable", "ItemHashKey", {name: "Ryan"}, console.log);
```

`updateItem` also accepts a key object to specify which item to update.

``` js
  dynode.updateItem("ExampleTable", {hash: "Key", range: 22}, {name: "Ryan"}, console.log);
```

Perform specific action to perform for the given update

``` js
  var updates = {nums: {'delete' : [5]}, age: {add: 2}};

  dynode.updateItem("ExampleTable", "ItemsHashKey", updates, console.log);
```

Delete the attribute from an existing item

``` js
  var updates = {age: {'Action' : 'DELETE'}};

  dynode.updateItem("ExampleTable", "ItemsHashKey", updates, console.log);
```

DynamoDB doesn't allow empty strings or empty sets
updateItem will delete attributes when passing in null, empty string, or empty array

``` js
  var updates = {age: null, nums: [], fullname: ''};

  dynode.updateItem("ExampleTable", "ItemsHashKey", updates, console.log);
```

`updateItem` accepts options which lets you pass in any option that Amazon accepts.

``` js
  var opts = {ReturnValues : "ReturnValuesConstant", Expected :{"status":{"Value":{"S":"offline"}}}};

  dynode.updateItem("ExampleTable", "TheKey", {name: "Ryan"}, opts, console.log);
```

<a name="getItem"></a>
## Get Item
The `getItem` operation returns a set of Attributes for an item that matches the primary key. For more info see [here][getItemDocs]

``` js
  dynode.getItem("ExampleTable", "TheHashKey", console.log);
```

`getItem` also accepts a key object to specify which item to get.

``` js
  dynode.getItem("ExampleTable", {hash: "TheHashKey", range: 123}, console.log);
```

`getItem` accepts any option that Amazon accepts.

``` js
  var opts = {AttributesToGet: ["status","friends"], ConsistentRead : true};

  dynode.getItem("ExampleTable", "TheHashKey", opts, console.log);
```

<a name="deleteItem"></a>
## Delete Item
Deletes a single item in a table by primary key. For more info see [here][deleteItemDocs]

``` js
  dynode.deleteItem("ExampleTable", "TheHashKey", console.log);
```

`deleteItem` also accepts a key object to specify which item to delete.

``` js
  dynode.deleteItem("ExampleTable", {hash: "TheHashKey", range: 123}, console.log);
```

`deleteItem` accepts any option that Amazon accepts.

``` js
  var opts = {ReturnValues : "ALL_OLD"};

  dynode.deleteItem("ExampleTable", "TheHashKey", opts, console.log);
```

<a name="query"></a>
## Query
A Query operation gets the values of one or more items and their attributes by primary key. For more info see [here][queryDocs]

``` js
  dynode.query("ExampleTable", "TheHashKey", console.log);
```

`query` accepts any option that Amazon accepts.

``` js
  var opts = {RangeKeyCondition: {AttributeValueList :[{"N":"AttributeValue2"}],"ComparisonOperator":"GT"}};

  dynode.query("ExampleTable", "TheHashKey", opts, console.log);
```

<a name="scan"></a>
## Scan
The Scan operation returns one or more items and its attributes by performing a full scan of a table. For more info see [here][scanDocs]

``` js
  dynode.scan("ExampleTable", console.log);
```

`scan` accepts any option that Amazon accepts.

``` js
  var opts = {
    Limit: 5,
    ScanFilter : {"AttributeName1":{"AttributeValueList":[{"S":"AttributeValue"}],"ComparisonOperator":"EQ"}},
    AttributesToGet : ["AttributeName1", "AttributeName2", "AttributeName3"]
  };

  dynode.scan("ExampleTable", opts, console.log);
```

<a name="batchGetItem"></a>
## Batch Get Item
The BatchGetItem operation returns the attributes for multiple items from multiple tables using their primary keys. For more info see [here][batchGetDocs]

``` js
  var query = {
    "ExampleTable": {keys:[{hash: "someKey"}, {hash: "someKey2"}]},
    "AnotherTable": {keys:[{hash: "anotherKey", range: 123}]}
  }

  dynode.batchGetItem(query, console.log);
```

`batchGetItem` accepts any option that Amazon accepts.

``` js
  var filter = {
    "ExampleTable": {keys:[{hash: "someKey"}], AttributesToGet :["name", "age"]},
    "AnotherTable": {keys:[{hash: "anotherKey", range: 123}], AttributesToGet :["brand", "price"]}
  }

  dynode.batchGetItem(filter, console.log);
```

<a name="batchWriteItem"></a>
## Batch Write Item
The BatchWriteItem operation This operation enables you to put or delete several items across multiple tables in a single API call. For more info see [here][batchWriteDocs]

``` js
  var writes = {
    "BatchTable": [
      {put : {id : "foo", name: "bar"}},
      {del : "hash-key"}
    ],
    "AnotherTable": [
      {del : {hash: "somekey", range: "foo"}},
      {del : {hash: "another key", range: "moar foo"}}
    ]
  };

  dynode.batchWriteItem(writes, console.log);
```

<a name="truncate"></a>
## Truncate
The Truncate operation will scan all items currently in the given table and remove them one by one.
This has the potential to use up your write capacity, so use this call with care.
note - This api is not provided directly by DynamoDB.

``` js
  var options = {
    throughputPercent : 0.5 // attempt to only consume 50% of write capacity, defaults to 100%
  };

  dynode.truncate("ExampleTable", options, console.log);
```

## Tests
All tests are written with [mocha][0] and should be run with make:

``` bash
  $ make test
```

#### Author: [Ryan Fitzgerald](http://twitter.com/#!/TheRyanFitz)
#### License: [Apache 2.0][1]

[0]: http://visionmedia.github.com/mocha/
[1]: http://www.apache.org/licenses/LICENSE-2.0
[createTablesDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_CreateTable.html
[listTablesDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_ListTables.html
[describeTableDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_DescribeTables.html
[updateTableDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_UpdateTable.html
[deleteTableDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_DeleteTable.html
[putItemDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_PutItem.html
[updateItemDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_UpdateItem.html
[getItemDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_GetItem.html
[deleteItemDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_DeleteItem.html
[queryDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_Query.html
[scanDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_Scan.html
[batchGetDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_BatchGetItems.html
[batchWriteDocs]: http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/API_BatchWriteItems.html
