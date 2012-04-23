var async = require('utile').async,
    _ = require('underscore'),
    Client = require("../lib/dynode/client").Client;

var DB = exports;

var client = DB.client = new Client({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
DB.TestTable = "TestTable";

DB.start = function(callback) {
  // truncate collections
};

DB.createProducts = function(products, callback) {
  if(!Array.isArray(products)) products = [products];

  var batchWrites = [];
  var i,j,chunk = 25;

  for (i=0,j=products.length; i<j; i+=chunk) {
    var chunks = products.slice(i,i+chunk);

    var writes = {};
    writes[DB.TestTable] = chunks.map(function(p){
      return {put : p};
    });

    batchWrites.push(async.apply(client.batchWriteItem.bind(client), writes));
  }

  async.parallel(batchWrites, callback);
};

DB.createProduct = function(product, cb) {
  client.putItem(DB.TestTable, product, cb);
};

DB.products = [
  {id: 'asos-jeans', brand: "test brand", url: "http://www.asos.com/p/1"},
  {id: 'modcloth-shoes', brand: "test brand", url: "http://www.modcloth.com/p/2"},
  {id: 'amazon-book', brand: "pragprog", url: "http://www.amazon.com/p/3"}
];

DB.deleteTable = function(tableName, callback) {
  client.deleteTable(tableName, function(err, resp){
    var isDeleted = false;
    
    async.until(
      function(){return isDeleted;},
      function(cb){
        client.describeTable(tableName, function(err, table){
          if(_.isUndefined(table)) isDeleted = true;
          setTimeout(cb, 1000);
        });
      }, callback
    );
  });
};

DB.createTable = function(tableName, callback) {
  client.createTable(tableName, function(err, resp){
    var isActive = false;
    
    async.until(
      function(){return isActive;},
      function(cb){
        client.describeTable(tableName, function(err, table) {
          if(!_.isNull(table) && table.TableStatus === "ACTIVE"){
            isActive= true;
          }
          setTimeout(cb, 1000);
        });
      }, callback
    );
  });

};