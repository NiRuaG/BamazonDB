USE `bamazon`;

TRUNCATE TABLE `products`;

INSERT INTO `products` 
  (`item_id`, `product_name`, `department_name`, `price`, `stock_quantity`, `product_sales`)
VALUES 
  (   19, "vel pede"               , "Outdoors",   9.99, 16, 5231.20),
  (   89, "donec quis"             , "Outdoors", 132.30, 45, 4864.98),
  (  810, "nibh"                   , "Toys"    ,   2.23,  0,  597.33),
  ( 1641, "metus arcu"             , "Beauty"  , 101.71,  3, 1467.96),
  ( 3218, "amet fermentum"         , "Tools"   ,   0.96, 73,  724.17),
  ( 3309, "nec euismod scelerisque", "Clothing", 224.99,  1, 2382.88),
  ( 4918, "ipsum integer"          , "Toys"    ,   8.80, 57, 3451.27),
  ( 6588, "sem duis aliquam"       , "Music"   ,   4.15, 42,   53.05),
  ( 7029, "turpis elementum"       , "Health"  ,  12.25, 16,  420.29),
  (21356, "luctus et"              , "Music"   ,  53.00,  7,  597.36)
;

ALTER TABLE `products` AUTO_INCREMENT=33182;

SELECT * FROM `products`;