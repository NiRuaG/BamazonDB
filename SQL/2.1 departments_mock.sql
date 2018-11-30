USE `bamazon`;

TRUNCATE TABLE `departments`;

INSERT INTO `departments` 
  (`department_id`, `department_name`, `over_head_costs`)
VALUES 
  ( 1, "Outdoors", 1000),
  ( 2, "Toys"    , 1200),
  ( 3, "Beauty"  , 2000),
  ( 4, "Tools"   , 2400),
  ( 5, "Clothing",  900),
  ( 6, "Music"   ,  500),
  ( 7, "Health"  , 4800)
;

SELECT * FROM `departments`;