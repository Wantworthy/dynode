var Types = require("../lib/dynode/types"),
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

});