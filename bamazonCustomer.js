//#region NPM
require('dotenv').config();
const mysql        = require('mysql');
const colors       = require('ansi-colors');
const table        = require('table').table;
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
const MAX_PRICE = 9999.99;
const MAX_PRICE_LENGTH = MAX_PRICE.toString().length;

const queryPromise = queryObj =>
  new Promise(function (resolve, reject) {
    let query = connection.query(queryObj, function (error, results, fields) {
      if (error) { return reject(error); }
      resolve(
        {
           results: results,
            fields: fields,
             query: query
        });
    });
  });


const getAllProducts = () =>
  queryPromise({
    sql: 'SELECT * FROM `products`',
  });

const updateProduct = (updateQueryObj) =>
  queryPromise({
    sql: "UPDATE `products` SET ? WHERE ?",
    values: [
      updateQueryObj.set, updateQueryObj.where
    ]
  });


async function afterConnection() {
  //*        QUERY - ALL PRODUCTS
  // #region QUERY - ALL PRODUCTS
  let products;
  try {
    products = (await getAllProducts()).results;
  } catch(error) {
    console.log(`Query error: ${error.code}: ${error.sqlMessage}`);
    return;
  }
  // console.log(products);
  // #endregion QUERY - ALL PRODUCTS
  if (!products) { //? Array.isArray(products) && products.length === 0) {
    console.log("Sorry, query returned no product results.");
    return;
  }

  let prodIDs = products.map(record => record.item_id);
  
  //*        DISPLAY TABLE
  // #region DISPLAY TABLE
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
        // wrapWord    : true, //!problem with table package & colors
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
  
  products.forEach((record, index) => {
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
  // #endregion DISPLAY TABLE

  //* PROMPT USER
  let userInput = await inquirer.prompt([
    {
      name: "productID",
      message: `Please enter the ${colors.green('ID')} of the product you wish to buy (or 'exit')):`,
      validate: checkID => {
        return checkID.toLowerCase() === "exit" 
          || prodIDs.includes(+checkID)
          || "No product known by that ID.";
      }
    },
    {
      name: "quantity",
      message: `How ${colors.green(many)} would you like to ${colors.green('buy')} (0 to cancel): `,
      when: userInput => userInput.productID !== 'exit',
      validate: checkQty => 
        (Number.isInteger(+checkQty) && +checkQty >= 0) || "Quantity needs to be a positive whole number.",
      filter: Number
    }
  ]);
  // console.log(userInput);

  if (userInput.productID === 'exit' || userInput.quantity === 0) { return; }

  const theProdID = Number(userInput.productID);
  const theBuyQty =        userInput.quantity  ;

  //! validation above assures there should be an indexOf (not -1)
  const theProduct = products[prodIDs.indexOf(theProdID)];
  const stockQty = theProduct.stock_quantity;

  if (stockQty < theBuyQty) {
    console.log(`Sorry, there is not enough of that product in stock to complete your order. Only ${stockQty} left).`);
    return;
  }

  //*        QUERY - UPDATE SELECTED PRODUCT
  // #region QUERY - UPDATE SELECTED PRODUCT  
  let updatedProduct;
  try {
    updatedProduct = (await updateProduct({
      set: {
        stock_quantity: stockQty - theBuyQty
      },
      where: {
        item_id: theProdID
      }
    })).results;
  } catch(error) {
    if (error.code && error.sqlMessage) {
      console.log(`Update error: ${error.code}: ${error.sqlMessage}`);
      return;
    }
    throw error;
  }
  // console.log(updatedProduct);
  // #endregion QUERY - UPDATE SELECTED PRODUCT
  if (updatedProduct.changedRows === 0) {
    console.log("Sorry, there was a problem with fulfilling the order. Please try again.");
    return;
  }
  if (updatedProduct.changedRows !== 1) {
    //! eep. id was not unique!? and now multiple rows were reduced in stock qty
    console.error("ERROR: purchase update affected multiple items.", updatedProduct);
    return; 
  }

  const cost = (theBuyQty * theProduct.price).toFixed(2);
  console.log(`Thank you for your purchase!\nYour total cost is ${colors.green('$'+cost)}`);
}

// #region START OF EXECUTION
connection.connect(async function(error) {
  if (error) { 
    console.log("Connection error: ", error.code);
    return;
  };
  // console.log("Connected to mysql db as id " + connection.threadId);
  try {
    await afterConnection();
  } catch(err) {
    console.error("An error occurred: ", err);
  }
  finally {
    console.log("FINALLY");
    connection.end();
  }
});
// #endregion START OF EXECUTION