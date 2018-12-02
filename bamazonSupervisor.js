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
  VIEW_PROD_SALES: {
    value: 'VIEW_PROD_SALES', name: "1. View Sales by Department", func: menu_ViewSalesByDepartment
  },

  ADD_DEPARTMENT: {
    value: 'ADD_DEPARTMENT' , name: "2. Create New Department"   , func: menu_AddNewDepartment
  },
}
//#endregion CONSTANTS

// #region MENU FUNCTIONS
async function menu_ViewSalesByDepartment() {
  //* Query
  let deptProfits;
  try {
    deptProfits = (await bamazon.query_DepartmentsProfits()).results;
  } catch(error) {
    if (error.code && error.sqlMessage) {
      // console.log(error);
      return console.log(`Query error: ${error.code}: ${error.sqlMessage}`);
    }
    // else
      throw error;
  }
  // console.log(deptProfits);

  // //* Display Results
  if (Array.isArray(deptProfits) && deptProfits.length === 0) {
    return console.log(`\n\t${colors.red("Sorry")}, there are no results.\n`);
  }

  bamazon.displayTable(deptProfits, 
    [ bamazon.TBL_CONST.DEPT_ID    , 
      bamazon.TBL_CONST.DEPT       , 
      bamazon.TBL_CONST.OVERHEAD   , 
      bamazon.TBL_CONST.TOTAL_SALES,
      bamazon.TBL_CONST.PROFITS ], 
    colors.black.bgBlue, colors.blueBright);

  return;
}

async function menu_AddNewDepartment() {
  //* QUERY - to list all departments
  let departmentList;
  try {
    departmentList = (await bamazon.query_DepartmentsSelectAll(
      ['department_id','department_name']
    )).results;
  } catch(error) {
    if (error.code && error.sqlMessage){
      return console.log(`Query error: ${error.code}: ${error.sqlMessage}`);
    }
    // else
      throw error;
  }
  // console.log(departmentList);
  
  if (Array.isArray(departmentList) && departmentList.length === 0) {
    console.log(`\n\tThere are currently no departments.`);
  } else {
    console.log(`\n\These are the current departments.`);
    bamazon.displayTable(departmentList, 
      [ bamazon.TBL_CONST.DEPT_ID, 
        bamazon.TBL_CONST.DEPT   ],
      colors.black.bgBlue, colors.blueBright);
  }

  //* PROMPT for New Department Info
  const newDeptInfo = (await inquirer.prompt([
    {
      name: 'name',
      message: `New Department's ${colors.blueBright('name')} (blank will cancel):`,
      filter: input => input.trim(),
    },
    {
      when: curAnswers => curAnswers.name,
      name: 'overhead',
      message: `New Department's ${colors.blueBright('over head costs')}:`,
      filter: Number, // filter happens before validate
      validate: checkCosts => {
        if (!(Number.isInteger(checkCosts) && checkCosts >= 0)) {
          return "Cost should be a positive whole number.";
        }
        return true;
      },
    },
    {
      when: curAnswers => curAnswers.name,
      name: 'confirmed',
      type: 'confirm',
      message: currAnswers => {
        console.log(`\n\tNew Department '${colors.blueBright(currAnswers.name)}' with over head cost of ${colors.blueBright('$'+currAnswers.overhead)}\n`);
        return "Is this correct?";
      }
    }
  ]));
  // console.log(newDeptInfo);
  if (!newDeptInfo.confirmed || !newDeptInfo.name) {
    return console.log(`\n\tOK.  [New Department] ${colors.red('Cancelled')}.\n`);
  }

  //* QUERY - INSERT New Department
  let insertedDept;
  try {
    insertedDept = (await bamazon.query_DepartmentsInsert(
      {
        department_name: newDeptInfo.name    ,
        over_head_costs: newDeptInfo.overhead
     })).results;
  } catch(error) {
    if (error.code && error.sqlMessage) {
      return console.log(`Insert error: ${error.code}: ${error.sqlMessage}`);
    }
    // else 
      throw error;
  }
  // console.log(insertedDept);

  if (insertedDept.affectedRows === 0) {
    return console.log(`\n\t${colors.red("Sorry")}, there was a problem adding the department. ${colors.green("Please try again")}.\n`);
  }

  //* Completion Message
  return console.log(`\n\tOK.  Department '${colors.blueBright(newDeptInfo.name)}', ID ${colors.blueBright('#'+insertedDept.insertId)}, added.\n`);
}
// #endregion MENU FUNCTIONS


async function afterConnection() {
  console.log(`\n\tWelcome, ${colors.green('BAMazon')} Supervisor!\n`);

  //* PROMPT - Menu Selection
  while(true) {
    let menuSelection = (await inquirer.prompt([
      {
        name: 'menuItem',
        type: 'list',
        choices: [
          MENU_CONST.VIEW_PROD_SALES,
          new inquirer.Separator(),
          MENU_CONST.ADD_DEPARTMENT,
          new inquirer.Separator(),
          { name: `${Object.keys(MENU_CONST).length+1}. Exit`, value: 'exit' }
        ],
        message: "Please select from the menu below:",
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