USE `bamazon`;

DROP TABLE IF EXISTS `departments`;

CREATE TABLE `departments` (
  -- * unique id for each department -- 
  `department_id`   INT UNSIGNED NOT NULL AUTO_INCREMENT, 

  -- * name of department --
  `department_name` VARCHAR(32) NOT NULL,

  -- * value of overhead costs --
  `over_head_costs` INT UNSIGNED NOT NULL,

  PRIMARY KEY (`item_id`)
);