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

  user: keys.mysql.user,
  password: keys.mysql.pw,
  
  database: "bamazon"
});

// #region START OF EXECUTION
connection.connect(function(err) {
  if (err) { throw err };
  // console.log("Connected to mysql db as id " + connection.threadId);
  afterConnection();
});

function afterConnection() {
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    console.log(res);
    connection.end();
  });
}
// #endregion START OF EXECUTION
