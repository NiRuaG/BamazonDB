-- TRUNCATE TABLE `products`;

INSERT INTO `bamazon`.`products` 
  (`item_id`, `product_name`, `price`, `stock_quantity`)
VALUES 
  ("MY9V0Q", "amet turpis elementum" , 2.25, 16),
  ("6VSZQR", "metus aenean fermentum", 0.96, 73),
  ("HDVSC2", "luctus et"             , 3.34, 73),
  ("6MRTOJ", "donec quis"            , 2.30, 45),
  ("MFDF1R", "ante"                  , 9.23, 16),
  ("1BIDY9", "nibh"                  , 2.23, 87),
  ("E3OZIE", "ipsum integer"         , 8.08, 57),
  ("BZY2F6", "metus arcu adipiscing" , 1.71, 92),
  ("ERQN22", "vel pede"              , 2.91,  1),
  ("VFL7TL", "sem duis aliquam"      , 4.15, 42)
;

-- SELECT * FROM `products`;