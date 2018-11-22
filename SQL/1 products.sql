USE `bamazon`;

DROP TABLE IF EXISTS `products`;

CREATE TABLE `products` (
  -- * unique id for each product -- 
  `item_id`         INT UNSIGNED NOT NULL AUTO_INCREMENT, 

  -- * Name of product --
  `product_name`    VARCHAR(64)  NOT NULL,

  -- * department_name --
  `department_name` VARCHAR(32),

  -- * cost to customer -- 
  `price`           DECIMAL(8,2) NOT NULL,

  -- * how much of the product is available in stores --
  `stock_quantity`  INT UNSIGNED NOT NULL,

  PRIMARY KEY (`item_id`)
);