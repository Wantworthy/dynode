# dynode [![Build Status](https://secure.travis-ci.org/Wantworthy/dynode.png)](http://travis-ci.org/Wantworthy/dynode)
Dynode is a node.js driver for working with Amazon's [DynamoDB](http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/Introduction.html?r=5378) service.

# API Documentation

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

# Installation

### Installing npm (node package manager)
``` bash
  $ curl http://npmjs.org/install.sh | sh
```

### Installing resourceful
``` bash 
  $ [sudo] npm install dynode
```

# Tests
All tests are written with [mocha][0] and should be run with make:

``` bash
  $ make test
```

#### Author: [Ryan Fitzgerald](http://twitter.com/#!/TheRyanFitz)
#### License: [Apache 2.0][1]

[0]: http://visionmedia.github.com/mocha/
[1]: http://www.apache.org/licenses/LICENSE-2.0