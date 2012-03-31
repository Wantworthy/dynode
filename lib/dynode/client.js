var events = require('events'),
    util = require('utile'),
    _ = require('underscore'),
    retry = require('retry'),
    Types = require('./types'),
    Request = require('./request').Request;

var Client = exports.Client = function Client(config) {
  if ( !config.accessKeyId || ! config.secretAccessKey) {
    throw new Error('You must set the AWS credentials: accessKeyId + secretAccessKey');
  }

  events.EventEmitter.call(this);

  this.config = config;
  this.request = new Request(config);
};

util.inherits(Client, events.EventEmitter);

Client.prototype.listTables = function(options, cb) {
  if (!cb || typeof cb != "function") {
    cb = options;
    options = {};
  }

  this._request("ListTables", options, cb);
};

Client.prototype.describeTable = function(name, cb) {
  this._request("DescribeTable", {"TableName": name}, function(err, resp){
    if(err) return cb(err);

    return cb(null, resp.Table);
  });
};

Client.prototype.createTable = function(name, options, cb) {
  // option is an optional parameter
  if (!cb || typeof cb != "function") {
    cb = options;
    options = {};
  }

  var config = util.mixin({}, {"TableName": name, read: 10, write: 5}, {hash : {id: String}}, options);
  this._request("CreateTable", this._toCreateTableSchema(config), cb);
};

Client.prototype.deleteTable = function(name, cb) {
  this._request("DeleteTable", {"TableName": name}, cb);
};

Client.prototype.updateTable = function(name, options, cb) {
  var config = util.mixin({}, {"TableName": name}, this._toUpdateTableSchema(options));
  this._request("UpdateTable", config, cb);
};

Client.prototype.putItem = function(tableName, item, options, cb) {
  if (!cb || typeof cb != "function") {
    cb = options;
    options = {};
  }
  
  var request = util.mixin({}, {TableName: tableName, Item: Types.stringify(item)}, options);
  this._request("PutItem", request, cb);
};

Client.prototype.updateItem = function(tableName, keys, item, options, cb) {
  // option is an optional parameter
  if (!cb || typeof cb != "function") {
    cb = options;
    options = {};
  }

  var request = util.mixin({}, {TableName: tableName, Key: Types.toKeys(keys), AttributeUpdates: Types.updateAttributes(item)}, options);
  
  this._request("UpdateItem", request, function (err, meta) {
    if (meta && meta.Attributes) meta.Attributes = Types.parse(meta.Attributes);
    
    cb(err, meta);
  });
};

Client.prototype.getItem = function(tableName, key, options, cb) {
  if (!cb || typeof cb != "function") {
    cb = options;
    options = {};
  }

  var request = util.mixin({}, {TableName: tableName, Key: Types.toKeys(key)}, options);

  this._request("GetItem", request, function(err, resp){
    if(err) return cb(err);

    return cb(null, Types.parse(resp.Item), {ConsumedCapacityUnits: resp.ConsumedCapacityUnits});
  });
};

Client.prototype.deleteItem = function(tableName, key, options, cb) {
  if (!cb || typeof cb != "function") {
    cb = options;
    options = {};
  }

  var request = util.mixin({}, {"TableName":tableName, Key: Types.toKeys(key)}, options);
  this._request("DeleteItem", request, function(err, resp){
    if(err) return cb(err);

    if(resp.Attributes) resp.Attributes = Types.parse(resp.Attributes);

    return cb(null, resp);
  });
};

Client.prototype.query = function(tableName, hashkey, options, cb) {
  if (!cb || typeof cb != "function") {
    cb = options;
    options = {};
  }

  var request = util.mixin({}, {"TableName":tableName}, Types.stringify( {"HashKeyValue": hashkey} ), options);
  this._request("Query", request, cb);
};

Client.prototype.scan = function(tableName, options, cb) {
  var args = Array.prototype.slice.call(arguments, 0);
  var cb = args.pop();
  var options = args.pop();

  if (!args.length) {
    tableName = options;
    options = {};
  }

  var filters = util.mixin({}, {"TableName":tableName}, options);
  this._request("Scan", filters, function(err, resp) {
    if(err) return cb(err);

    var items = {};
    if(resp.Items) {
      var items = _.map(resp.Items, Types.parse);
      delete resp.Items;
    }

    return cb(null, items, resp);
  });
};

Client.prototype.batchGetItem = function(options, cb) {
  
  var request = _.reduce(options, function(memo, opt, table) {
    var attrs = {Keys : _.map(opt.keys, Types.toKeys) };
    if(opt.AttributesToGet) attrs.AttributesToGet = opt.AttributesToGet;
    
    memo[table] = attrs;
    return memo;
  }, {});

  this._request("BatchGetItem", {RequestItems: request}, function(err, resp){
    if(err) return cb(err);
    
    var responses = {};
    var meta = {UnprocessedKeys: resp.UnprocessedKeys, ConsumedCapacityUnits: {}};
    for (var table in resp.Responses) {
      meta.ConsumedCapacityUnits[table] = resp.Responses[table].ConsumedCapacityUnits;
      responses[table] = resp.Responses[table].Items.map(Types.parse)
    }
    return cb(null, responses, meta);
  });      
};

Client.prototype._request = function(action, options, cb) {
  var self = this;

  var operation = retry.operation({retries: 10, factor: 2, minTimeout: 50});
  
  operation.attempt(function(currentAttempt) {
    self.request.send(action, options, function(err, resp) {
      if(err && err.retry && operation.retry(err)) return; // check to see if should retry request

      cb(err, resp);
    });
  });

};

Client.prototype._toCreateTableSchema = function(options) {
  return {
    "TableName" : options.TableName,
    "KeySchema" : this._parseKeySchema(options),
    "ProvisionedThroughput":this._parseThroughputSchema(options)
  };
};

Client.prototype._toUpdateTableSchema = function(options) {
  return {
    "ProvisionedThroughput":this._parseThroughputSchema(options)
  };
};

Client.prototype._parseThroughputSchema = function(options) {
  return {"ReadCapacityUnits":options.read,"WriteCapacityUnits":options.write};
};

Client.prototype._parseKeySchema = function(options) {
  var hashKeyName = Object.keys(options.hash)[0];
  var hashKeyType = options.hash[hashKeyName].name[0].toUpperCase();
  var keySchema = {"HashKeyElement":{"AttributeName": hashKeyName, "AttributeType": hashKeyType}};

  if(options.range) {
    var rangeKeyName = Object.keys(options.range)[0];
    var rangeKeyType = options.range[rangeKeyName].name[0].toUpperCase();
    keySchema["RangeKeyElement"] = {"AttributeName":rangeKeyName,"AttributeType":rangeKeyType};
  };

  return keySchema;
}