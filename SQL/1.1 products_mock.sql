USE `bamazon`;

TRUNCATE TABLE `products`;

INSERT INTO `products` 
  (`item_id`, `product_name`, `department_name`, `price`, `stock_quantity`)
VALUES 
  (   19, "vel pede"               , "Outdoors",   9.23, 16),
  (   89, "donec quis"             , "Outdoors", 132.30, 45),
  (  810, "nibh"                   , "Toys"    ,   2.23,  0),
  ( 1641, "metus arcu"             , "Beauty"  , 101.71,  3),
  ( 3218, "amet fermentum"         , "Tools"   ,   0.96, 73),
  ( 3309, "nec euismod scelerisque", "Clothing",   2.91,  1),
  ( 4918, "ipsum integer"          , "Toys"    ,   8.08, 57),
  ( 6588, "sem duis aliquam"       , "Music"   ,   4.15, 42),
  ( 7029, "turpis elementum"       , "Health"  ,  12.25, 16),
  (21356, "luctus et"              , "Music"   ,  53.34, 73)
;

ALTER TABLE `products` AUTO_INCREMENT=33182;

SELECT * FROM `products`;