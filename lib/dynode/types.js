var _ = require('underscore');

// convert json to DynamoDB json with type indicators
exports.stringify = function(attrs) {
  var result = {};
  
  _.each(attrs, function(value, key) {
    var attr = {};
    attr[typeIndicator(value)] = toString(value);

    result[key] = attr;
  });
  
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
  } else if(value.toString){
    return value.toString();
  } else {
    throw new Error("Unsupported Data type: "+ Object.prototype.toString.call(value));
  }
};