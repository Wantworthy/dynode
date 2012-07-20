var Signer = require("../../lib/dynode/aws-signer"),
    util = require('utile'),
    should = require('chai').should();

describe("AWS version 4 signer", function() {
  // these are the test credentials provided by the amazon test suite
  // see http://docs.amazonwebservices.com/general/latest/gr/signature-v4-test-suite.html#signature-v4-test-suite-derived-creds
  var credentials = {accessKeyId: "fakeKeyId", secretAccessKey: "secret"},
      region = "us-east-1",
      body = {
        "TableName":"my-table",
        "Keys":[{"HashKeyElement":{"S":"Bill & Ted's Excellent Adventure"},"RangeKeyElement":{"S":1989}}]
      };

  var headers = {
    "host": "dynamodb.us-east-1.amazonaws.com",
    "x-amz-date": "Mon, 16 Jan 2012 17:50:52 GMT",
    "x-amz-target": "DynamoDB_20111205.GetItem",
    "content-type" : "application/x-amz-json-1.0"
  };

  var request = {
    method : "POST",
    uri : "/",
    query : "",
    headers : headers,
    body : JSON.stringify(body)
  };

  it("should generate canonical request", function() {
    var expected = [
      "POST",
      "/",
      "",
      "content-type:application/x-amz-json-1.0",
      "host:dynamodb.us-east-1.amazonaws.com",
      "x-amz-date:Mon, 16 Jan 2012 17:50:52 GMT",
      "x-amz-target:DynamoDB_20111205.GetItem" + "\n",
      "content-type;host;x-amz-date;x-amz-target",
      "2e7f349e500e10dd9f3b194656850082459dd7f8f2c0025c2306246b3a1b3edf"].join("\n");

    Signer.canonicalRequest(request).should.eql(expected);
  });

  it("should generate canonical headers", function() {
    var expected = [
      "content-type:application/x-amz-json-1.0",
      "host:dynamodb.us-east-1.amazonaws.com",
      "x-amz-date:Mon, 16 Jan 2012 17:50:52 GMT",
      "x-amz-target:DynamoDB_20111205.GetItem"
    ].join("\n");

    Signer._canonicalHeaders(request.headers).should.eql(expected);
  });

  it("should generate signed headers", function() {
    var expected = ["content-type","host","x-amz-date","x-amz-target"].join(";");

    Signer._signedHeaders(request.headers).should.eql(expected);
  });

  it("should digest the body", function() {
    Signer._digest("Action=ListGroupsForUser&UserName=Test&Version=2010-05-08")
          .should.eql("14a1b0cf5748461c63d3a5fee5e42ed623422b7b4fa62a58a57258f1a195cff8");
  });

  it("should generate request date in proper format", function() {
    var d = new Date("2012-02-28T02:22:10.000Z");
    Signer._requestDate(d).should.eql("20120228T022210Z");
  });

  it("should generate credential scope", function() {
    var d = new Date("2012-02-28T02:22:10.000Z");
    Signer._credentialScope(d, "us-east-1").should.eql("20120228/us-east-1/dynamodb/aws4_request");
  });

  it("should generate string to sign", function(){
    var expected = [
      "AWS4-HMAC-SHA256",
      "20120228T022210Z",
      "20120228/us-east-1/dynamodb/aws4_request",
      "e59538c538586c305a276c1be9428832888d8c27cb277513563a82c7d01db86b"].join("\n");

    var d = new Date("2012-02-28T02:22:10.000Z");
    Signer.stringToSign(request, d, region).should.eql(expected);
  });

  it("should generate full signature", function() {
    var d = new Date("2012-02-28T02:22:10.000Z");
    var signature = Signer.signature(credentials, request, d, region);
    
    new Buffer(signature, "binary").toString("hex").should.eql("45ff518b58d5a6f5efeea7711341ebace5b23dcfa2d27bd13fdcdaf84973959b");
  });

  it("should authorization string", function() {
    var d = new Date("2012-02-28T02:22:10.000Z");
    var auth = Signer.authorization(credentials, request, d, region);
    console.log(auth);
    // signature.should.eql("d211c0edd7705306e8840240f38e5dc120a178ed1d6840f51e990ffe28f6124b");
  });

});