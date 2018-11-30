//#region NPM
const colors   = require('ansi-colors');
const inquirer = require('inquirer');
//#endregion

//#region LOCAL Modules
const bamazon = require("./bamazon");
// console.log(bamazon);
//#endregion

//#region CONSTANTS
const MENU_CONST = {
  VIEW_PROD: {
    value: 'VIEW_PROD'    , name: "1. View All Products" , func: menu_ViewProductsForSale
  },

  VIEW_LOWSTOCK: {
    value: 'VIEW_LOWSTOCK', name: "2. View Low Inventory", func: menu_ViewLowInventory
  },

  ADD_STOCK: {
    value: 'ADD_STOCK'    , name: "3. Add to Inventory"  , func: menu_AddToInventory
  },

  ADD_PRODUCT: {
    value: 'ADD_PRODUCT'  , name: "4. Add New Product"   , func: menu_AddNewProduct
  },
}
//#endregion CONSTANTS

// #region MENU FUNCTIONS
async function menu_ViewProductsForSale() {
  //* Query
  let products;
  try {
    products = (await bamazon.query_ProductsSelectAll(
      ['item_id', 'product_name', 'price', 'stock_quantity']
    )).results;
  } catch(error) {
    if (error.code && error.sqlMessage) {
      // console.log(error);
      return console.log(`Query error: ${error.code}: ${error.sqlMessage}`);
    }
    // else
      throw error;
  }
  // console.log(products);

  //* Display Results
  if (Array.isArray(products) && products.length === 0) {
    return console.log(`\n\t${colors.red("Sorry")}, there are no such product results.\n`);
  }

  bamazon.displayTable(products, 
    [ bamazon.TBL_CONST.ID   , 
      bamazon.TBL_CONST.PROD , 
      bamazon.TBL_CONST.PRICE, 
      bamazon.TBL_CONST.STOCK ], 
    colors.black.bgGreen, colors.green);

  return;
}

async function menu_ViewLowInventory() {
  //* Query
  let products;
  try {
    products = (await bamazon.query_ProductsInLowStock(
      ['item_id', 'product_name', 'price', 'stock_quantity']
    )).results;
  } catch(error) {
    if (error.code && error.sqlMessage) {
      // console.log(error);
      return console.log(`Query error: ${error.code}: ${error.sqlMessage}`);
    }
    // else
      throw error;
  }
  // console.log(products);

  //* Display Results
  if (Array.isArray(products) && products.length === 0) {
    return console.log(`\n\t${colors.red("Sorry")}, there are no such product results.\n`);
  }

  bamazon.displayTable(products, 
    [ bamazon.TBL_CONST.ID   , 
      bamazon.TBL_CONST.PROD , 
      bamazon.TBL_CONST.PRICE, 
      bamazon.TBL_CONST.STOCK ], 
    colors.black.bgRed, colors.redBright);

  return;
}

async function menu_AddToInventory() {
  //* QUERY - SELECT All Products
  let products;
  try {
    products = (await bamazon.query_ProductsSelectAll(
      ['item_id', 'product_name', 'stock_quantity']
    )).results;
  } catch(error) {
    if (error.code && error.sqlMessage){
      return console.log(`Query error: ${error.code}: ${error.sqlMessage}`);
    }
    // else
      throw error;
  }
  // console.log(products);

  const prodIDs = products.map(record => record.item_id);

  //* PROMPT for Product & Quantity
  let theProduct;
  const prodIDInput = (await inquirer.prompt([
    {
      name: "productID",
      message: `Product ${colors.green('ID')} to stock (or 'exit')):`,
      validate: checkID => {
        if (checkID.toLowerCase() === "exit") {
          return true;
        } 
        theProduct = products.find(record => record.item_id === checkID);
        return (theProduct >= 0) || "No product known by that ID.";
      }
    }
  ])).productID;
  // console.log(prodIDInput);
  if (prodIDInput === 'exit') { 
    return console.log(`\n\tOK.  Add to Stock ${colors.red("Exited")}\n`); 
  }

  const qtyInput = (await inquirer.prompt([
    {
      name: "quantity",
      message: `How ${colors.green('much')} would you like to add to stock (0 to cancel): `,
      filter: Number, // filter happens before validate 
      validate: checkQty => 
        Number.isInteger(checkQty) && checkQty >= 0
          || "Quantity needs to be a positive whole number."
    }
  ])).quantity;
  // console.log(qtyInput);
  if (qtyInput === 0) { 
    return console.log(`\n\tOK.  Add to Stock ${colors.red("Cancelled")}.\n`);
  }

  //* QUERY - UPDATE Selected Product
  let updatedProduct;
  try {
    updatedProduct = (await bamazon.query_ProductsUpdate({
      set: {
        stock_quantity: theProduct.stock_quantity + qtyInput
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
    return console.log(`\n\t${colors.red("Sorry")}, there was a problem stocking the product. ${colors.green("Please try again")}.\n`);
  }
  if (updatedProduct.changedRows !== 1) {
    //! eep. id was not unique!? now multiple rows were added in stock qty
    return console.error("ERROR: stock update affected multiple items.", updatedProduct);
  }

  //* Completion Message
  return console.log(`\n\tOK.  ${colors.green(qtyInput)} units added to Product ${colors.green('#'+prodIDInput)}, '${theProduct.product_name}'\n`);
}

async function menu_AddNewProduct() {
  //* PROMPT for New Product Info
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
  // console.log(newProdInput);
  if (!newProdInput.confirmed || !newProdInput.name) {
    return console.log(`\n\tOK.  New Product ${colors.red('CANCELLED')}\n`);
  }

  //* QUERY - INSERT New Product
  let insertedProduct;
  try {
    insertedProduct = (await bamazon.query_ProductsInsert(
      {
          product_name : newProdInput.name    ,
                 price : newProdInput.price   ,
        stock_quantity : newProdInput.quantity
     })).results;
  } catch(error) {
    if (error.code && error.sqlMessage) {
      return console.log(`Insert error: ${error.code}: ${error.sqlMessage}`);
    }
    // else 
      throw error;
  }
  // console.log(insertedProduct);

  if (insertedProduct.affectedRows === 0) {
    return console.log(`\n\t${colors.red("Sorry")}, there was a problem adding the product. ${colors.green("Please try again")}.\n`);
  }

  //* Completion Message
  return console.log(`\n\tOK.  Product '${colors.green(newProdInput.name)}', ID ${colors.green('#'+insertedProduct.insertId)}, added\n`);
}
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
          MENU_CONST.VIEW_PROD    ,
          MENU_CONST.VIEW_LOWSTOCK,
          new inquirer.Separator(),
          MENU_CONST.ADD_STOCK    ,
          MENU_CONST.ADD_PRODUCT  ,
          new inquirer.Separator(),
          { name: "5. Exit", value: 'exit' }
        ],
        message: `Please select from the menu below:`,
      }
    ])).menuItem;
    // console.log(menuSelection);
    if (menuSelection === 'exit') { return; }

    await MENU_CONST[menuSelection].func();
  }
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