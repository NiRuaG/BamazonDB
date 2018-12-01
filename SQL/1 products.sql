USE `bamazon`;

DROP TABLE IF EXISTS `products`;

CREATE TABLE `products` (
  -- * unique id for each product -- 
  `item_id`         INT UNSIGNED NOT NULL AUTO_INCREMENT, 

  -- * Name of product --
  `product_name`    VARCHAR(64)  NOT NULL,

  -- * department_name --
  `department_name` VARCHAR(32)  NOT NULL,

  -- * cost to customer -- 
  `price`           DECIMAL(8,2) NOT NULL,

  -- * how much of the product is available in stores --
  `stock_quantity`  INT UNSIGNED NOT NULL,

  -- * total sales of this product --
  `product_sales`   DECIMAL(12,2) NOT NULL DEFAULT 0, 

  PRIMARY KEY (`item_id`)
);