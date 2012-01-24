var request = require('request'),
    events = require('events'),
    URL = require('url'),
    util = require('utile'),
    _ = require('underscore'),
    signer = require('./request-signer'),
    Types = require('./types'),
    STS = require('./sts').STS;

var defaults = {
  prefix : "DynamoDB_20111205.",
  host : "dynamodb.us-east-1.amazonaws.com"
};

var Client = exports.Client = function Client(config) {
  if ( !config.accessKeyId || ! config.secretAccessKey) {
    throw new Error('You must set the AWS credentials: accessKeyId + secretAccessKey');
  }

  events.EventEmitter.call(this);

  this.config = config;
  this.sts = new STS(config);
};

util.inherits(Client, events.EventEmitter);

Client.prototype.listTables = function(options, cb) {
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

Client.prototype.putItem = function(tableName, item, cb) {
  var request = {TableName: tableName, Item: Types.stringify(item)};
  this._request("PutItem", request, cb);
};

Client.prototype.getItem = function(tableName, key, cb) {
  var request = {TableName: tableName, Key: Types.toKeys(key)};
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
    
    var items = _.map(resp.Items, Types.parse);
    delete resp.Items;

    return cb(null, items, resp);
  });
};

Client.prototype._request = function(action, options, cb) {
  this.sts.getSessionToken(function(err, credentials) {
    if(err) return cb(err);

    var headers = {
      "host" : defaults.host,
      "x-amz-date" : new Date().toGMTString(),
      "x-amz-security-token" : credentials.sessionToken,
      "x-amz-target" : defaults.prefix + action,
      "content-type" : "application/x-amz-json-1.0"
    };

    var signedHeaders = signer.sign(headers, options, credentials);

    request({
      method : "POST",
      headers : signedHeaders,
      url : URL.format({host:defaults.host, protocol: "https"}),
      body : JSON.stringify(options),
    }, function(err, resp, body) {
      if(err) return cb(err);

      var json = JSON.parse(body);
      if(resp.statusCode != 200) return cb(new Error(json["__type"]+ ":" + json["message"]));

      return cb(null, json);
    });

  });
};

Client.prototype._toCreateTableSchema = function(options) {
  var hashKeyName = Object.keys(options.hash)[0];
  var hashKeyType = options.hash[hashKeyName].name[0].toUpperCase();
  var KeySchema = {"HashKeyElement":{"AttributeName": hashKeyName, "AttributeType": hashKeyType}};

  if(options.rangeKey) {
    var rangeKeyName = Object.keys(options.range)[0];
    var rangeKeyType = options.range[rangeKeyName].name[0].toUpperCase();
    KeySchema["RangeKeyElement"] = {"AttributeName":rangeKeyName,"AttributeType":rangeKeyType};
  };

  return {
    "TableName" : options.TableName,
    "KeySchema" : {"HashKeyElement":{"AttributeName": hashKeyName, "AttributeType": hashKeyType}},
    "ProvisionedThroughput":{"ReadCapacityUnits":options.read,"WriteCapacityUnits":options.write}
  };

};