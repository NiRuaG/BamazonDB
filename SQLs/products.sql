USE bamazon;

-- DROP TABLE IF EXISTS products;

CREATE TABLE products (
  -- * unique id for each product -- 
  `item_id` CHAR(6) NOT NULL, 

  -- * Name of product --
  `product_name` VARCHAR(64) NOT NULL,

  -- * department_name --
  `department_name` VARCHAR(32),

  -- * cost to customer -- 
  `price` DECIMAL(8,2) NOT NULL,

  -- * how much of the product is available in stores --
  `stock_quantity` INT UNSIGNED NOT NULL,

  UNIQUE (`item_id`)
);