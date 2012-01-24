var _ = require('underscore');

// convert json to DynamoDB json with type indicators
exports.stringify = function(attrs) {
  var result = {};
  
  _.each(attrs, function(value, key) {
    var attr = {};
    if(!_.isUndefined(value) && !_.isNull(value) && !isEmptyArray(value)) {
      attr[typeIndicator(value)] = toString(value);
      result[key] = attr;
    }
  });
  
  return result;
};

// Convert to DynamoDB keys
exports.toKeys = function(keys) {
  if(_.isNumber(keys) || _.isString(keys)){
    return this.stringify({"HashKeyElement" : keys});
  } else if (keys.hash) {
    return this.stringify({"HashKeyElement" : keys.hash, "RangeKeyElement" : keys.range});
  } else {
    throw new Error("Invalid Hashkey " + keys);
  }
};

function typeIndicator(value) {
  if(_.isArray(value)) {
    return typeIndicator(_.first(value))+ "S";
  } else {
    return _.isNumber(value) ? "N" : "S";
  }
};

function toString(value) {
  if(_.isArray(value)) {
    return value.map(toString);
  } else if(_.isNumber(value)) {
    return Number(value).toString();
  } else if(value.toString){
    return value.toString();
  } else {
    throw new Error("Unsupported Data type: "+ Object.prototype.toString.call(value));
  }
};

function isEmptyArray(obj) {
  return _.isArray(obj) && _.isEmpty(obj);
};