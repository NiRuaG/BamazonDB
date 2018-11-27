//#region NPM
require('dotenv').config();
const colors   = require('ansi-colors');
const inquirer = require('inquirer');
//#endregion

//#region LOCAL Modules
const bamazon = require("./bamazon");
// console.log(bamazon);
//#endregion


// #region Query Promises
const query_AllProductsInStock = () =>
  bamazon.queryPromise({
    sql: 'SELECT * FROM `products` WHERE `stock_quantity` > 0',
  });

const query_UpdateProduct = (updateQueryObj) =>
  bamazon.queryPromise({
      sql: "UPDATE `products` SET ? WHERE ?",
    values: [
      updateQueryObj.set, updateQueryObj.where
    ]
  });
// #endregion Query Promises

async function afterConnection() {
  console.log(`\n\tWelcome to ${colors.green('BAMazon')}!\nThe below items are in stock and available for purchase.\n`);

  //*        QUERY - ALL PRODUCTS
  // #region QUERY - ALL PRODUCTS
  let products;
  try {
    products = (await query_AllProductsInStock()).results;
  } catch(error) {
    if (error.code && error.sqlMessage) {
      console.log(`Query error: ${error.code}: ${error.sqlMessage}`);
    }
    else throw error;
  }
  // console.log(products);
  if (!products) { //? Array.isArray(products) && products.length === 0) {
    console.log("Sorry, query returned no product results.");
    return;
  }
  // #endregion QUERY - ALL PRODUCTS

  const prodIDs = products.map(record => record.item_id);
  
  bamazon.displayTable(products, colors.black.bgGreen, colors.green);

  //*        PROMPT USER for Product & Quantity
  // #region PROMPT USER
  const prodIDInput = (await inquirer.prompt([
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

  const qtyInput = (await inquirer.prompt([
    {
      name: "quantity",
      message: `How ${colors.green('many')} would you like to buy (0 to cancel order): `,
      filter: Number, // filter happens before validate 
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
bamazon.connection.connect(async function(error) {
  if (error) { 
    return console.log(`Connection error: ${error.code || "(no code)"}: ${error.sqlMessage || "(no message)"}`);
  };
  // console.log("Connected to mysql db as id " + bamazon.connection.threadId);
  try {
    await afterConnection();
  } catch(error) {
    console.error("An error occurred: ", error);
  }
  finally {
    // console.log("FINALLY");
    return bamazon.connection.end();
  }
});
// #endregion START OF EXECUTION