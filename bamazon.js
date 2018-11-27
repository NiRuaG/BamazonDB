//// const table        = require('table').table;
const mysql        = require('mysql');
const createStream = require('table').createStream;
const colors       = require('ansi-colors');

require('dotenv').config();
const keys = require("./keys");


const TBL_CONST = {
  ID   : { header: " ID "           , max: 999999    },
  PRICE: { header: " Price "        , max:   9999.99 },
  STOCK: { header: " Stock "        , max:    999    },

  PROD : { header: "  Product Name ", width: 20 },
};
for (let c of Object.values(TBL_CONST)) {
  c.width = c.width || Math.max(c.header.length, c.max.toString().length);
}


const bamazon = {
  connection: mysql.createConnection({
    host: "localhost",
    port: 3306,
  
    user    : keys.mysql.user,
    password: keys.mysql.pw  ,
  
    database: "bamazon"
  }),

  displayTable(products, headerColor = colors.black.bgGreen, rowStripeColor = colors.green) {
    const stream = createStream({
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
      ].map(headerColor));
    
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
      if (index&1) { dataRow = dataRow.map(rowStripeColor) };
      stream.write(dataRow);
    });
    
    return console.log('\n'); // stream needs a new line (or 2) when complete
  },

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
  
  
}

module.exports = bamazon;