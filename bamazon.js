//// const table        = require('table').table;
const mysql  = require('mysql');
const table  = require('table').table;
const colors = require('ansi-colors');

const keys = require("./keys");


const bamazon = {
  connection: mysql.createConnection({
    host: "localhost",
    port: 3306,
  
    user    : keys.mysql.user,
    password: keys.mysql.pw  ,
  
    database: "bamazon"
  }),

  TBL_CONST: {
    ID   : { field: "item_id"       , header: " ID "   , max:  999999    , alignment: 'right' },
    PRICE: { field: "price"         , header: " Price ", max: '$ 9999.99', alignment: 'right' },
    STOCK: { field: "stock_quantity", header: " Stock ", max:     999    , alignment: 'right' },
    
    DEPT: { field: "department_name", header: "  Dept. "       , width: 20, alignment: 'left', truncate: 64 },
    PROD: { field:    "product_name", header: "  Product Name ", width: 24, alignment: 'left', truncate: 64 } // wrapWord    : true, //!problem with table package & colors
  },

  displayTable(products, columns, headerColor=colors.black.bgGreen, rowStripeColor = colors.green) {
    //* Table Rows
    let data = products.map((product, index) => {
        // console.log(product);
        let dataRow = columns.map(col => {
          if (col.field === "price") {
            return `$ ${product.price.toFixed(2).padStart(bamazon.TBL_CONST.PRICE.width-2)}`;
          }
          // else 
            return product[col.field];
        });

        // apply color to every-other row
        if (index&1) { dataRow = dataRow.map(rowStripeColor) };

        return dataRow;
    });

    //* Table Headers
    data.unshift(
      columns.map(col => {
        if (col.alignment === 'right') {
          return headerColor(col.header.padStart(col.width));
        }
        // else
        if (col.alignment === 'left' ) {
          return headerColor(col.header.padEnd  (col.width));
        }
        // else
          return headerColor(col.header);
      }));

    const config = {
      columns: columns
    };

    return console.log(table(data, config))
  },

  // #region Query Promises
  queryPromise: queryObj =>
    new Promise( function(resolve, reject) {
      const query = bamazon.connection.query(queryObj, function(error, results, fields) {
        if (error) { return reject(error); }
        resolve(
          {
             results : results,
              fields : fields,
               query : query
          });
      });
    }),

  query_ProductsSelect: selectQueryObj => 
    bamazon.queryPromise({
      sql : 'SELECT ?? FROM `products` WHERE ?',
      values : [
        selectQueryObj.select, selectQueryObj.where
      ]
    }),

  query_ProductsSelectAll: (select = '*') =>
    bamazon.queryPromise({
      sql : 'SELECT ?? FROM `products`',
      values : [ select ]
    }),

  query_ProductsUpdate: updateQueryObj => 
    bamazon.queryPromise({
         sql: "UPDATE `products` SET ? WHERE ?",
      values: [
        updateQueryObj.set,
        updateQueryObj.where
      ]
    }),
  
  query_ProductsInsert: insertQueryObj => 
    bamazon.queryPromise({
        sql: "INSERT INTO `products` SET ?",
      values: [insertQueryObj]
    }),

  query_ProductsInStock: (select = '*') => 
    bamazon.query_ProductsSelect({
      select : select,
       where : { toSqlString: () => '`stock_quantity` > 0' }
    }),

  query_ProductsInLowStock: (select = '*') => 
    bamazon.query_ProductsSelect({
      select : select,
       where : { toSqlString: () => '`stock_quantity` < 5' }
    }),

  query_DepartmentsSelectAll: (select = '*') =>
    bamazon.queryPromise({
      sql : 'SELECT ?? FROM `departments`',
      values : [ select ]
    }),
  
  // #endregion Query Promises
}

for (let col of Object.values(bamazon.TBL_CONST)) {
  col.width = col.width || Math.max(col.header.length, col.max.toString().length);
}

module.exports = bamazon;