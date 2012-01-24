var async = require('utile').async,
    Client = require("../lib/dynode/client").Client;

var DB = exports;

var client = DB.client = new Client({accessKeyId : process.env.AWS_ACCEESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY});
DB.TestTable = "TestTable";

DB.start = function(callback) {
  // truncate collections
};

DB.createProducts = function(products, callback) {
  if(!Array.isArray(products)) products = [products];

  async.forEach(products, DB.createProduct, callback);
};

DB.createProduct = function(product, cb) {
  client.putItem(DB.TestTable, product, cb);
};

DB.products = [
  {id: 'asos-jeans', brand: "test brand", url: "http://www.asos.com/p/1"},
  {id: 'modcloth-shoes', brand: "test brand", url: "http://www.modcloth.com/p/2"},
  {id: 'amazon-book', brand: "pragprog", url: "http://www.amazon.com/p/3"}
];