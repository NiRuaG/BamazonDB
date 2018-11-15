//#region NPM
require('dotenv').config();
const mysql        = require('mysql');
const colors       = require('ansi-colors');
const createStream = require('table').createStream;
const inquirer     = require('inquirer');
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

      let   idArr = [];
      let restArr = [];
      results.forEach( record => {
            idArr.push(record.item_id);
          restArr.push([
            record.product_name,
            record.price
        ]);
        // console.log(record);
        // return Array.from(record);
      });
      console.log(idArr, restArr);

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
            // wrapWord    : true, //!problem with package
            truncate    : 64 },
          2: { 
            width       : MAX_PRICE_LENGTH+2, 
            alignment   : 'right', 
            paddingLeft : 1 },
        }
      });

      // Headers
      stream.write([
        colors.black.bgGreen(`${"ID ".padStart(MAX_ID_LENGTH)}`), 
        colors.black.bgGreen(`${"  Product Name".padEnd(20)}`), 
        colors.black.bgGreen(`${"Price ".padStart(MAX_PRICE_LENGTH+2)}`)
      ]);
      
      results.forEach((record, index) => {
        // console.log(record);
        let oddIndexRow = index&1;
        stream.write([
          oddIndexRow ? 
            colors.green(record.item_id) 
                       : record.item_id,
          oddIndexRow ? 
            colors.green(record.product_name) 
                       : record.product_name,
          oddIndexRow ? 
            colors.green(`$ ${record.price.toFixed(2).padStart(MAX_PRICE_LENGTH)}`) 
                       : `$ ${record.price.toFixed(2).padStart(MAX_PRICE_LENGTH)}`,
        ]);
      });
      console.log(); // stream needs a new line when complete

      inquirer.prompt([
        {
          name: "productID",
          message: `Please enter the ${colors.green('ID')} of the product you wish to buy:`,
          validate: checkID => {
            return idArr.includes(+checkID) || "No product known by that ID.";
          }
        },
        {
          name: "quantity",
          message: `How many would you like to buy: `,
          validate: checkQty => {
            return (!Number.isNaN(checkQty) && +checkQty > 0 && Number.isInteger(+checkQty)) || "Quantity needs to be a positive whole number.";
          }
        }
      ])
      .then(function(answers) {

      });
    });
}

// #region START OF EXECUTION
connection.connect(function(error) {
  if (error) { 
    console.log("Connection error: ", error.code);
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