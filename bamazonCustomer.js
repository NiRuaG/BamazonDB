//#region NPM
require('dotenv').config();
const mysql = require("mysql");
//#endregion

//#region LOCAL Modules
const keys = require("./keys");
// console.log({ keys });
//#endregion

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,

  user    : keys.mysql.user,
  password: keys.mysql.pw  ,

  database: "bamazon"
});

function afterConnection() {
  const queryFields = ['item_id', 'product_name', 'price'];
  connection.query({
    sql: 'SELECT ?? FROM `products`',
  }, 
  [queryFields],

  function(error, res) {
    if (error) { 
      console.log("Query error: ", error.code);
      return;
    };

    if (Array.isArray(res) && res.length === 0) {
      console.log("Sorry, query returned no results.");
      return;
    }

    res.forEach(record => {
      console.log(record);
    });

  });
}

// #region START OF EXECUTION
connection.connect(function(err) {
  if (err) { 
    console.log("Connection error: ", err.code);
    return;
  };
  // console.log("Connected to mysql db as id " + connection.threadId);
  try {
    afterConnection();
  }
  finally {
    connection.end();
  }
});
// #endregion START OF EXECUTION