var Types = require("../../lib/dynode/types"),
    should = require('should');

describe('Types', function() {

  describe("stringify", function() {

    it("converts string attributte", function(){
      var converted = Types.stringify({foo : "Bar"});

      converted.should.eql({"foo":{"S":"Bar"}});
    });

    it("converts number attribute", function() {
      var converted = Types.stringify({foo : 123});

      converted.should.eql({"foo":{"N":"123"}});
    });

    it("converts string array", function() {
      var converted = Types.stringify({foo : ["a", "b", "c"]});

      converted.should.eql({"foo":{"SS":["a", "b", "c"]}});
    });

    it("converts number array", function() {
      var converted = Types.stringify({foo : [123, 44, 55]});

      converted.should.eql({"foo":{"NS":['123', '44', '55']}});
    });

    it("removes empty array from attributes", function() {
      var converted = Types.stringify({foo : [123], bar:[]});

      converted.should.eql({"foo":{"NS":['123']}});
    });

    it("converts date to a string", function() {
      var date = new Date,
          converted = Types.stringify({foo : date});

      converted.should.eql({"foo":{"S":date.toString()}});
    });

  });

  describe("toKeys", function() {
    
    it("accepts string as hash key", function(){
      var keys = Types.toKeys("Blah");

      keys.should.eql({"HashKeyElement":{"S":"Blah"}});
    });

    it("accepts number as hash key", function(){
      var keys = Types.toKeys(55.55);

      keys.should.eql({"HashKeyElement":{"N":"55.55"}});
    });

    it("accepts object with string hash key", function(){
      var keys = Types.toKeys({hash : "Foo"});

      keys.should.eql({"HashKeyElement":{"S":"Foo"}});
    });

    it("accepts object with number hash key", function(){
      var keys = Types.toKeys({hash : 123});

      keys.should.eql({"HashKeyElement":{"N": '123'}});
    });

    it("accepts object with hash and range key", function() {
      var keys = Types.toKeys({hash : "baz", range: 456});

      keys.should.eql({"HashKeyElement":{"S": 'baz'}, "RangeKeyElement":{"N": '456'}});
    });

  });

  describe("parse", function(){
    
    it("converts to string", function(){
      var json = Types.parse({"status":{"S":"online"}});

      json.should.eql({status : "online"});
    });

    it("converts to number", function(){
      var json = Types.parse({"age":{"N":"144"}});

      json.should.eql({age : 144});
    });

    it("converts number set", function(){
      var json = Types.parse({"nums":{"NS":["144", "22", "33"]}});

      json.should.eql({nums : [144, 22, 33]});
    });

    it("converts string set", function(){
      var json = Types.parse({"names":{"SS":["Ryan", "Steve", "John"]}});

      json.should.eql({names : ["Ryan", "Steve", "John"]});
    });

    it("converts complex object", function() {
      var item = {
        "nums": {"NS":["144", "22", "33"]},
        "age" : {"N": '22'},
        "name": {"S": 'Tim'},
        "strs": {"SS": ["foo", "bar", "baz"]}
      };

      var expected = {
        "nums": [144, 22, 33],
        "age" : 22,
        "name": "Tim",
        "strs": ["foo", "bar", "baz"]
      }
      var json = Types.parse(item);

      json.should.eql(expected);
    });

  });

  describe("update Attributes", function() {
    it("converts simple json to all puts", function(){
      var json = Types.updateAttributes({name: "Foo", age: 44, nums: [1,2,3], strs: ["Ryan", "ED", "Fitz"]});
      
      json.should.eql({
        "name":{"Value":{"S":"Foo"},"Action":"PUT"},
        "age" :{"Value":{"N":"44"},"Action":"PUT"},
        "nums" :{"Value":{"NS":["1","2", "3"]},"Action":"PUT"},
        "strs" :{"Value":{"SS":["Ryan","ED", "Fitz"]},"Action":"PUT"}
      });

    });

  });

});