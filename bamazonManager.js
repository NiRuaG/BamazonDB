//#region NPM
const colors   = require('ansi-colors');
const inquirer = require('inquirer');
//#endregion

//#region LOCAL Modules
// console.log({ keys });
const bamazon = require("./bamazon");
// console.log(bamazon);
//#endregion

//#region CONSTANTS
const MENU_CONST = {
  VIEW_PROD: {
    value: 'VIEW_PROD'    , name: "1. View Products for Sale", func: menu_ViewProductsForSale
  },

  VIEW_LOWSTOCK: {
    value: 'VIEW_LOWSTOCK', name: "2. View Low Inventory"    , func: menu_ViewLowInventory
  },

  ADD_STOCK: {
    value: 'ADD_STOCK'    , name: "3. Add to Inventory"      , func: menu_AddToInventory
  },

  ADD_PRODUCT: {
    value: 'ADD_PRODUCT'  , name: "4. Add New Product"       , func: menu_AddNewProduct
  },
}
//#endregion CONSTANTS

// #region Query Promises
const query_ProductsAll = () =>
  bamazon.queryPromise({
    sql: 'SELECT * FROM `products`',
  });

const query_ProductsWithLowStock = () =>
  bamazon.queryPromise({
    sql: 'SELECT * FROM `products` WHERE `stock_quantity` < 5',
  });

const query_UpdateProduct = (updateQueryObj) =>
  bamazon.queryPromise({
      sql: "UPDATE `products` SET ? WHERE ?",
    values: [
      updateQueryObj.set,
      updateQueryObj.where
    ]
  });

const query_InsertProduct = (insertQueryObj) => 
  bamazon.queryPromise({
      sql: "INSERT INTO `products` SET ?",
    values: [insertQueryObj]
  });
// #endregion Query Promises


// #region MENU FUNCTIONS
async function menu_ViewProductsForSale() {
  //*        QUERY - ALL PRODUCTS
  // #region QUERY - ALL PRODUCTS
  let products;
  try {
    products = (await query_ProductsAll()).results;
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

  bamazon.displayTable(products, colors.black.bgGreen, colors.green);

  return;
}

async function menu_ViewLowInventory() {
  //*        QUERY - ALL PRODUCTS
  // #region QUERY - ALL PRODUCTS
  let products;
  try {
    products = (await query_ProductsWithLowStock()).results;
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

  bamazon.displayTable(products, colors.black.bgRed, colors.red);

  return;
}

async function menu_AddToInventory() {
  //*        QUERY - ALL PRODUCTS
  // #region QUERY - ALL PRODUCTS
  let products;
  try {
    products = (await query_ProductsAll()).results;
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

  //*        PROMPT USER for Product & Quantity
  // #region PROMPT USER
  const prodIDInput = (await inquirer.prompt([
    {
      name: "productID",
      message: `Product ${colors.green('ID')} to stock (or 'exit')):`,
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

  const qtyInput = (await inquirer.prompt([
    {
      name: "quantity",
      message: `How ${colors.green('much')} would you like to add to stock (0 to cancel): `,
      filter: Number, //* filter happens before validate 
      validate: checkQty => 
        Number.isInteger(checkQty) && checkQty >= 0
          || "Quantity needs to be a positive whole number."
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
        stock_quantity: theProduct.stock_quantity + qtyInput
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
    else throw error;
  }
  // console.log(updatedProduct);
  if (updatedProduct.changedRows === 0) {
    console.log("Sorry, there was a problem stocking the product. Please try again.");
    return;
  }
  if (updatedProduct.changedRows !== 1) {
    //! eep. id was not unique!? now multiple rows were added in stock qty
    console.error("ERROR: stock update affected multiple items.", updatedProduct);
    return; 
  }
  // #endregion QUERY - UPDATE SELECTED PRODUCT

  //* Display Stock Completion
  console.log(`\n\tOK.  ${colors.green(qtyInput)} units added to Product #${colors.green(prodIDInput)}, '${theProduct.product_name}'\n`);

  return;
}

async function menu_AddNewProduct() {
  //*        PROMPT USER for New Product Info
  // #region PROMPT USER
  const newProdInput = (await inquirer.prompt([
    {
      name: 'name',
      message: `New Product's ${colors.green('name')} (blank will cancel):`,
      filter: input => input.trim(),
    },
    {
      when: curAnswers => curAnswers.name,
      name: 'price',
      message: `New Product's ${colors.green('price')}:`,
      filter: Number, // filter happens before validate
      validate: checkPrice => {
        if (!(Number.isInteger(checkPrice*100) && checkPrice > 0)) {
          return "Price needs to be a positive number (up to 2 digits after decimal).";
        }
        return true;
      },
    },
    {
      when: curAnswers => curAnswers.name,
      name: 'quantity',
      message: `New Product's initial ${colors.green('quantity')} in stock:`,
      default: 0,
      filter: Number,
      validate: checkQty => {
        if (!(Number.isInteger(checkQty) && checkQty >= 0)) {
          return "Quantity needs to be a non-negative whole number."
        }
        return true;
      }
    },
    {
      when: curAnswers => curAnswers.name,
      name: 'confirmed',
      type: 'confirm',
      message: currAnswers => {
        console.log(`\n\t${colors.green(currAnswers.quantity)} units of '${colors.green(currAnswers.name)}'  @ ${colors.green('$'+currAnswers.price.toFixed(2))}\n`);
        return "Is this correct?";
      }
    }
  ]));
  console.log(newProdInput);
  if (!newProdInput.confirmed || !newProdInput.name) {
    console.log(`\n\tNew Product ${colors.red('CANCELLED')}\n`);
    return;
  }

  //*        QUERY - INSERT New Product
  // #region QUERY - INSERT   
  let insertedProduct;
  try {
    insertedProduct = (await query_InsertProduct(
      {
          product_name : newProdInput.name,
                 price : newProdInput.price,
        stock_quantity : newProdInput.quantity
     })).results;
  } catch(error) {
    if (error.code && error.sqlMessage) {
      console.log(`Insert error: ${error.code}: ${error.sqlMessage}`);
      return;
    }
    else throw error;
  }
  // console.log(insertedProduct);

  if (insertedProduct.affectedRows === 0) {
    console.log("Sorry, there was a problem adding the product. Please try again.");
    return;
  }
  // #endregion QUERY - UPDATE SELECTED PRODUCT

  //* Display Completion Message
  console.log(`\n\t${colors.green("OK")}. Product '${colors.green(newProdInput.name)}', ID ${'#'+colors.green(insertedProduct.insertId)}, added\n`);

  return;
}

// #endregion MENU FUNCTIONS
// #endregion MENU FUNCTIONS

async function afterConnection() {
  console.log(`\n\tWelcome ${colors.green('BAMazon')} Manager!\n`);

  //*        PROMPT - Menu Selection
  // #region PROMPT - Menu Selection
  while(true) {
    let menuSelection = (await inquirer.prompt([
      {
        name: 'menuItem',
        type: 'list',
        choices: [
          MENU_CONST.VIEW_PROD,
          MENU_CONST.VIEW_LOWSTOCK,
          new inquirer.Separator(),
          MENU_CONST.ADD_STOCK,
          MENU_CONST.ADD_PRODUCT,
          new inquirer.Separator(),
          { name: "5. Exit", value: 'exit' }
        ],
        message: `Please select from the menu below:`,
      }
    ])).menuItem;
    // console.log(menuItem);
    if (menuSelection === 'exit') { return; }
    await MENU_CONST[menuSelection].func();
  }
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