USE `bamazon`;

TRUNCATE TABLE `products`;

INSERT INTO `products` 
  (`item_id`, `product_name`, `price`, `stock_quantity`)
VALUES 
  (   19, "ante"                  , 9.23, 16),
  (   89, "donec quis"            , 2.30, 45),
  (  810, "nibh"                  , 2.23, 87),
  ( 1641, "metus arcu adipiscing" , 1.71, 92),
  ( 3218, "metus aenean fermentum", 0.96, 73),
  ( 3309, "vel pede"              , 2.91,  1),
  ( 4918, "ipsum integer"         , 8.08, 57),
  ( 6588, "sem duis aliquam"      , 4.15, 42),
  ( 7029, "amet turpis elementum" , 2.25, 16),
  (61356, "luctus et"             , 3.34, 73)
;

ALTER TABLE `products` AUTO_INCREMENT=81596;

SELECT * FROM `products`;