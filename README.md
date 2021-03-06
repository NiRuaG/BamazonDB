# Welcome to BAMazon!
Storefront Database for Customers, Managers, and Supervisors

## Requirements
* You will need a running MySQL Database, including user and password info.  
Refer to the included `key.js` file and the [dotenv](https://www.npmjs.com/package/dotenv) npm documentation.  

## Setup
* Included in the repository are `.sql` files to setup the database & tables, including some mock data.

## Demo Videos
* [DEMO Video](https://drive.google.com/file/d/1uwJnm76lLIxTrE5Kofr0gJ43cAxBESUB/view)


## Customer Interface (`bamazonCustomer.js`)
![](./images/readme-customer.png)  
1. Customer is presented with a table of products that are in stock, including ID#s & prices.  
1. Customer inputs a **product ID** and a **quantity**.  
1. With valid input, database will deplete stock quantity and add to the products sales value.  
1. If order can be fulfilled, message will be displayed with the order's total cost.  


## Manager Interface (`bamazonManager.js`)
![](./images/readme-manager.png)  
*Manager is presented with options menu*
### `View All Products`
1. Displays table of all Products  
### `View Low Inventory`
1. Displays table of Products with < 5 items left  
### `Add to Inventory`
1. Prompts manager for **product's ID** and a **quantity** to add to stock.  
1. With valid input, database is updated to add inventory.  
### `Add New Product`
1. Prompts manager for new product's `name`, `price`, initial `stock quantity`, and the `department` to which the product belongs.  
1. With valid input, a new product is inserted into the database.  


## Supervisor Interface (`bamazonSupervisor.js`) 
![](./images/readme-supervisor.png)  
*Supervisor is presented with options menu*
### `View Sales by Department`
1. Displays table that summarizes the profits (total sales less overhead) of each department.  
### `Create New Department`
1. Prompts supervisor for new department's `name` and its `over head cost` value.  
1. With valid input, a new department is inserted into database.  
