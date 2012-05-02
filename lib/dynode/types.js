var _ = require('underscore');

// convert json to DynamoDB json with type indicators
exports.stringify = function(attrs) {
  var result = {};
  
  _.each(attrs, function(value, key) {
    var attr = {};
    if(!_.isUndefined(value) && !_.isNull(value) && !isEmptyArray(value) && value !== '') {
      attr[typeIndicator(value)] = toString(value);
      result[key] = attr;
    }
  });
  
  return result;
};

//converts type coerced DynamoDB json to regular json
exports.parse = function(attrs) {
  if(!attrs || Object.keys(attrs).length === 0) return null;
  
  return _.reduce(attrs, function(memo, value, key, obj) {
    memo[key] = valueFromHash(value);
    return memo;
  }, {});
};

// Convert to DynamoDB keys
exports.toKeys = function(keys) {
  if(_.isNumber(keys) || _.isString(keys)) {
    return exports.stringify({"HashKeyElement" : keys});
  } else if (keys.hash) {
    return exports.stringify({"HashKeyElement" : keys.hash, "RangeKeyElement" : keys.range});
  } else {
    throw new Error("Invalid Hashkey " + keys);
  }
};

exports.updateAttributes = function(attrs) {
    
  var result = _.reduce(attrs, function(memo, value, key, obj) {
    var attr = {};
    if(value != '' && !_.isUndefined(value) && !_.isNull(value) && !isEmptyArray(value)) {

      if(Object.prototype.toString.call(value) === '[object Object]') {
        var action = Object.keys(value)[0];

        if(value[action] === 'DELETE' && !value['Value']) {
          attr.Action = 'DELETE'
        } else {
          attr.Action = String.prototype.toUpperCase.call(action);
          if(!_.isUndefined(value[action]) && !_.isNull(value[action]) && !isEmptyArray(value[action])) {
            attr.Value = {};
            attr.Value[typeIndicator(value[action])] = toString(value[action]);
          }
        }
      } else {
        attr.Value = {};
        attr.Value[typeIndicator(value)] = toString(value);
        attr.Action = 'PUT';  
      }
    } else {
      attr.Action = 'DELETE';
    }

    memo[key] = attr;

    return memo;
  },{});
  
  return result;
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
  } else if (value.toJSON) {
    return value.toJSON();
  } else if(value.toString){
    return value.toString();
  } else {
    throw new Error("Unsupported Data type: "+ Object.prototype.toString.call(value));
  }
};

function isEmptyArray(obj) {
  return _.isArray(obj) && _.isEmpty(_.compact(obj));
};

function valueFromHash(obj) {
  var type = Object.keys(obj)[0];
  var val = obj[type];

  switch(type) {
    case "S":
      return val;
      break;
    case "N":
      return Number(val);
      break;
    case "NS":
      return _.map(val, function(v){return Number(v);});
      break;
    case "SS":
      return val;
      break;
    default:
      throw new Error("Unsupported type: "+ type);
  }
};