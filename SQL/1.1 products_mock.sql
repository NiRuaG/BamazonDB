USE `bamazon`;

TRUNCATE TABLE `products`;

INSERT INTO `products` 
  (`item_id`, `product_name`, `price`, `stock_quantity`)
VALUES 
  (   19, "vel pede"               ,   9.23, 16),
  (   89, "donec quis"             , 132.30, 45),
  (  810, "nibh"                   ,   2.23, 87),
  ( 1641, "metus arcu"             ,   1.71, 92),
  ( 3218, "amet fermentum"         ,   0.96, 73),
  ( 3309, "nec euismod scelerisque",   2.91,  1),
  ( 4918, "ipsum integer"          ,   8.08, 57),
  ( 6588, "sem duis aliquam"       ,   4.15, 42),
  ( 7029, "turpis elementum"       ,  12.25, 16),
  (21356, "luctus et"              ,   3.34, 73)
;

ALTER TABLE `products` AUTO_INCREMENT=61356;

SELECT * FROM `products`;