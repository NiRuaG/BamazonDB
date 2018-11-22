//#region NPM
require('dotenv').config();
const mysql        = require('mysql');
const colors       = require('ansi-colors');
//// const table        = require('table').table;
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

const TBL_CONST = {
  ID   : { header: " ID "           , max: 999999    },
  PRICE: { header: " Price "        , max:   9999.99 },
  STOCK: { header: " Stock "        , max:    999    },

  PROD : { header: "  Product Name ", width: 20 },
};
for (let c of Object.values(TBL_CONST)) {
  c.width = c.width || Math.max(c.header.length, c.max.toString().length);
}

const queryPromise = queryObj =>
  new Promise(function (resolve, reject) {
    let query = connection.query(queryObj, function(error, results, fields) {
      if (error) { return reject(error); }
      resolve(
        {
           results: results,
            fields: fields,
             query: query
        });
    });
  });

// #region Query Promises
const query_AllProductsInStock = () =>
  queryPromise({
    sql: 'SELECT * FROM `products` WHERE `stock_quantity` > 0',
  });

const query_UpdateProduct = (updateQueryObj) =>
  queryPromise({
      sql: "UPDATE `products` SET ? WHERE ?",
    values: [
      updateQueryObj.set, updateQueryObj.where
    ]
  });
// #endregion Query Promises

function displayTable(products) {
  let stream = createStream({
    columnDefault: { width: 12 },
    columnCount: 4,
    columns: {
      0: { 
        width       : TBL_CONST.ID.width, 
        alignment   : 'right', 
        paddingLeft : 1,
        paddingRight: 1 },
      1: { 
        width       : TBL_CONST.PROD.width, 
        alignment   : 'left', 
        paddingLeft : 1,
        paddingRight: 1,
        // wrapWord    : true, //!problem with table package & colors
        truncate    : 64 },
      2: { 
        width       : TBL_CONST.PRICE.width+2, //% +2 for '$ '
        alignment   : 'right', 
        paddingLeft : 1 },
      3: {
        width       : TBL_CONST.STOCK.width,
        alignment   : 'right',
        paddingLeft : 1 }
    }
  });

  //* Table Headers
  stream.write(
    [
      `${TBL_CONST.ID   .header.padStart(TBL_CONST.ID   .width  )}`, 
      `${TBL_CONST.PROD .header.padEnd  (TBL_CONST.PROD .width  )}`, 
      `${TBL_CONST.PRICE.header.padStart(TBL_CONST.PRICE.width+2)}`, //% +2 for '$ '
      `${TBL_CONST.STOCK.header.padStart(TBL_CONST.STOCK.width  )}`
    ].map(colors.black.bgGreen));
  
  //* Table Rows
  products.forEach((record, index) => {
    // console.log(record);
    let dataRow = [
      record.item_id, 
      record.product_name, 
      `$ ${record.price.toFixed(2).padStart(TBL_CONST.PRICE.width)}`,
      record.stock_quantity
    ];
    // apply color to every-other row
    if (index&1) { dataRow = dataRow.map(colors.green) };
    stream.write(dataRow);
  });
  console.log(); // stream needs a new line when complete
  return;
}


async function afterConnection() {
  //*        QUERY - ALL PRODUCTS
  // #region QUERY - ALL PRODUCTS
  let products;
  try {
    products = (await query_AllProductsInStock()).results;
  } catch(error) {
    console.log(`Query error: ${error.code}: ${error.sqlMessage}`);
    return;
  }
  // console.log(products);
  if (!products) { //? Array.isArray(products) && products.length === 0) {
    console.log("Sorry, query returned no product results.");
    return;
  }
  // #endregion QUERY - ALL PRODUCTS

  const prodIDs = products.map(record => record.item_id);
  
  displayTable(products);

  //*        PROMPT USER for Product & Quantity
  // #region PROMPT USER
  let prodIDInput = (await inquirer.prompt([
    {
      name: "productID",
      message: `Please enter the ${colors.green('ID')} of the product you wish to buy (or 'exit')):`,
      validate: checkID => 
        checkID.toLowerCase() === "exit" 
          || prodIDs.includes(+checkID) 
          || "No product known by that ID."
    }
  ])).productID;
  // console.log(prodIDInput);
  if (prodIDInput === 'exit') { return; }

  //% validation above assures there should be an indexOf (not -1)
  const theProduct = products[prodIDs.indexOf(Number(prodIDInput))];
  const stockQty = theProduct.stock_quantity;

  let qtyInput = (await inquirer.prompt([
    {
      name: "quantity",
      message: `How ${colors.green('many')} would you like to buy (0 to cancel order): `,
      filter: Number, //* filter happens before validate 
      validate: checkQty => {
        if (!(Number.isInteger(checkQty) && checkQty >= 0)) {
          return "Quantity needs to be a positive whole number."
        }
        if (stockQty < checkQty) {
          return `Not enough in stock. Only ${colors.green(stockQty)} left.`
        }
        return true;
      },
    }
  ])).quantity;
  // console.log(qtyInput);
  if (qtyInput === 0) { return; }
  // #endregion PROMPT USER
  
  //*        QUERY - UPDATE SELECTED PRODUCT
  // #region QUERY - UPDATE SELECTED PRODUCT  
  let updatedProduct;
  try {
    updatedProduct = (await query_UpdateProduct({
      set: {
        stock_quantity: stockQty - qtyInput
      },
      where: {
        item_id: prodIDInput
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
  if (updatedProduct.changedRows === 0) {
    console.log("Sorry, there was a problem with fulfilling the order. Please try again.");
    return;
  }
  if (updatedProduct.changedRows !== 1) {
    //! eep. id was not unique!? and now multiple rows were reduced in stock qty
    console.error("ERROR: purchase update affected multiple items.", updatedProduct);
    return; 
  }
  // #endregion QUERY - UPDATE SELECTED PRODUCT

  //* Display Order Completion
  const cost = (qtyInput * theProduct.price).toFixed(2);
  console.log(`\nThank you for your purchase!\nYour total cost is ${colors.green('$'+cost)}`);
}

// #region START OF EXECUTION
connection.connect(async function(error) {
  if (error) { 
    console.log("Connection error: ", error.code);
    return;
  };
  // console.log("Connected to mysql db as id " + connection.threadId);
  console.log(`\nWelcome to ${colors.green('BAMazon')}!\nThe below items are in stock and available for purchase.`);
  try {
    await afterConnection();
  } catch(err) {
    console.error("An error occurred: ", err);
  }
  finally {
    // console.log("FINALLY");
    connection.end();
  }
});
// #endregion START OF EXECUTION