# dynode [![Build Status](https://secure.travis-ci.org/Wantworthy/dynode.png)](http://travis-ci.org/Wantworthy/dynode)
Dynode is a node.js driver for working with Amazon's [DynamoDB](http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/Introduction.html?r=5378) service.

## Installation

### Installing npm (node package manager)
``` bash
  $ curl http://npmjs.org/install.sh | sh
```

### Installing dynode
``` bash 
  $ [sudo] npm install dynode
```

## Usage
There are two different ways to use dynode: directly via the default dynamoDB client, or by instantiating your own client. The former is merely intended to be a convenient shared client to use throughout your application if you so choose.

### Using the Default DynamoDB Client
The default client is accessible through the dynode module directly. Any method that you could call on an instance of a client is available on the default client:

``` js
  var dynode = require('dynode');
  dynode.auth({accessKeyId: "AWSAccessKey", secretAccessKey: "SecretAccessKey"});

  dynode.createTable("NewTable", console.log);
  dynode.listTables(console.log);
```

### Instantiating your own DynamoDB Client
If you would prefer to manage your own client, pontentially with different auth params if you want:

``` js
  var client = new (dynode.Client)({
	accessKeyId: "AWSAccessKey", secretAccessKey: "SecretAccessKey"
  });
```

## API Documentation

* [Auth](#auth)
* [List Tables](#listTables)
* [Describe Table](#describeTable)
* [Create Table](#createTable)
* [updateTable](#updateTable)
* [Put Item](#putItem)
* [Update Item](#updateItem)
* [Get Item](#getItem)
* [Delete Item](#deleteItem)
* [Query](#query)
* [Scan](#scan)
* [Batch Get Item](#batchGetItem)

## Tests
All tests are written with [mocha][0] and should be run with make:

``` bash
  $ make test
```

#### Author: [Ryan Fitzgerald](http://twitter.com/#!/TheRyanFitz)
#### License: [Apache 2.0][1]

[0]: http://visionmedia.github.com/mocha/
[1]: http://www.apache.org/licenses/LICENSE-2.0