//#region NPM
require('dotenv').config();
const mysql = require('mysql');
const chalk = require('chalk');
const createStream = require('table').createStream;
const inquirer = require('inquirer');
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

const MAX_ID = 999999;
const MAX_ID_LENGTH = MAX_ID.toString().length;
const MAX_PRICE = 999.99;
const MAX_PRICE_LENGTH = MAX_PRICE.toString().length;

function afterConnection() {
  const queryFields = ['item_id', 'product_name', 'price'];
  connection.query({
    sql: 'SELECT ?? FROM `products`',
  },
    [queryFields],

    function (error, results) {
      if (error) {
        console.log("Query error: ", error.code);
        return;
      };

      if (Array.isArray(results) && results.length === 0) {
        console.log("Sorry, query returned no results.");
        return;
      }

      let stream = createStream({
        columnDefault: { width: 12 },
        columnCount: 3,
        columns: {
          0: { 
            width       : MAX_ID_LENGTH, 
            alignment   : 'right', 
            paddingLeft: 1,
            paddingRight: 1 },
          1: { 
            width       : 20, 
            alignment   : 'left' , 
            paddingLeft : 2,
            paddingRight: 1,
            //! wrapWord    : true, //!problem with package
            truncate    : 64 },
          2: { 
            width       : MAX_PRICE_LENGTH+2, 
            alignment   : 'right', 
            paddingLeft : 1 },
        }
      });

      stream.write([
        chalk.white.bgBlue(`${"ID ".padStart(MAX_ID_LENGTH)}`), 
        chalk.white.bgBlue(`${"  Product Name".padEnd(20)}`), 
        chalk.white.bgBlue(`${"Price ".padStart(MAX_PRICE_LENGTH+2)}`)
      ]);

      results.forEach((record, index) => {
        // console.log(record);
        let oddIndexRow = index&1;
        stream.write([
          oddIndexRow ? 
              chalk.blue(record.item_id) 
                       : record.item_id,
          oddIndexRow ? 
              chalk.blue(record.product_name) 
                       : record.product_name,
          oddIndexRow ? 
            chalk.blue(`$ ${record.price.toFixed(2).padStart(MAX_PRICE_LENGTH)}`) 
                     : `$ ${record.price.toFixed(2).padStart(MAX_PRICE_LENGTH)}`,
        ]);
      });

      
    });
}

/**
 * @typedef {Object} table~columns
 * @property {string} alignment Cell content alignment (enum: left, center, right) (default: left).
 * @property {number} width Column width (default: auto).
 * @property {number} truncate Number of characters are which the content will be truncated (default: Infinity).
 * @property {number} paddingLeft Cell content padding width left (default: 1).
 * @property {number} paddingRight Cell content padding width right (default: 1).
 */

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