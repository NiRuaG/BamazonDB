//#region NPM
const colors   = require('ansi-colors');
const inquirer = require('inquirer');
//#endregion

//#region LOCAL Modules
const bamazon = require("./bamazon");
// console.log(bamazon);
//#endregion


async function afterConnection() {
  console.log(`\n\tWelcome to ${colors.green('BAMazon')}!\n\nThe below items are in stock and available for purchase.\n`);

  //*        QUERY - ALL PRODUCTS
  let products;
  try {
    products = (await bamazon.query_ProductsInStock(
      ['item_id', 'product_name', 'price', 'stock_quantity', 'product_sales']
    )).results;
  } catch(error) {
    if (error.code && error.sqlMessage) {
      return console.log(`Query error: ${error.code}: ${error.sqlMessage}`);
    }
    // else 
      throw error;
  }
  // console.log(products);
  if (Array.isArray(products) && products.length === 0) {
    return console.log(`\n\t${colors.red("Sorry")}, there are no such product results.\n`);
  }

  bamazon.displayTable(products, 
    [ bamazon.TBL_CONST.PROD_ID, 
      bamazon.TBL_CONST.PROD   , 
      bamazon.TBL_CONST.PRICE  , 
      bamazon.TBL_CONST.STOCK ], 
    colors.black.bgGreen, colors.green);

  //* PROMPT USER for Product & Quantity
  let theProduct;
  const prodIDInput = (await inquirer.prompt([
    {
      name: "productID",
      message: `Please enter the ${colors.green('ID')} of the product you wish to buy (or 'exit')):`,
      validate: checkID => {
        if (checkID.toLowerCase() === "exit") {
          return true;
        } 
        theProduct = products.find(record => record.item_id === Number(checkID));
        return (theProduct !== undefined) || "No product known by that ID.";
      }
    }
  ])).productID;
  // console.log(prodIDInput);
  if (prodIDInput === 'exit') {
    return console.log(`\n\tOK.  Order ${colors.red("Exited")}.  Come back again!\n`); 
  }

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
        // else
        if (stockQty < checkQty) {
          return `Not enough in stock. Only ${colors.green(stockQty)} left.`
        }
        // else
        return true;
      }
    }
  ])).quantity;
  // console.log(qtyInput);
  if (qtyInput === 0) {
    return console.log(`\n\tOK.  Order ${colors.red("Cancelled")}.\n`); 
  }

  //% scientific 'e2' (instead of *100) avoids problems with some rounding problems (eg Math.round(1.005 *100)) = 100 not 101
  const totalCost = Math.round((qtyInput * theProduct.price)+'e2')/100;

  //*        QUERY - UPDATE SELECTED PRODUCT
  // #region QUERY - UPDATE SELECTED PRODUCT  
  let updatedProduct;
  try {
    updatedProduct = (await bamazon.query_ProductsUpdate({
      set: {
        stock_quantity : stockQty - qtyInput,
         product_sales : theProduct.product_sales + totalCost,
      },
      where: {
        item_id: prodIDInput
      }
    })).results;
  } catch(error) {
    if (error.code && error.sqlMessage) {
      return console.log(`Update error: ${error.code}: ${error.sqlMessage}`);
    }
    // else
      throw error;
  }
  // console.log(updatedProduct);

  if (updatedProduct.changedRows === 0) {
    return console.log(`\n\t${colors.red("Sorry")}, there was a problem with fulfilling the order.  ${colors.green("Please try again")}.\n`);
  }
  if (updatedProduct.changedRows !== 1) {
    //! eep. id was not unique!? and now multiple rows were reduced in stock qty
    return console.error("ERROR: purchase update affected multiple items.", updatedProduct);
  }
  // #endregion QUERY - UPDATE SELECTED PRODUCT

  //* Completion Message
  return console.log(`\n\t${colors.green("Thank you")} for your order!\n\tYour total purchase cost is ${colors.green('$'+totalCost.toFixed(2))}`);
}

// #region START OF EXECUTION
bamazon.connection.connect(async function(error) {
  if (error) { 
    return console.log(`Connection error: ${error.code || "(no code)"}: ${error.sqlMessage || "(no SQL message)"}`);
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