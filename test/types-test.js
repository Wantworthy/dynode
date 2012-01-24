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

    it("converts date to a string", function() {
      var date = new Date,
          converted = Types.stringify({foo : date});

      converted.should.eql({"foo":{"S":date.toString()}});
    });

  });

});