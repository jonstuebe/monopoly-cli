import chalk from "chalk";
import { getPropertyBySlug, buyProperty, properties } from "./properties";
import { createUser, getUserPropertyByProperty } from "./user";
import { buyHouse, buyHotel, sellHouse, sellHotel } from "./building";
import { throwIfError } from "./utils";

import { User, UserProperty, Property } from "./types";

let user = createUser("Jon");

function twoPropertyTest() {
  const property = getPropertyBySlug("baltic_avenue", properties) as Property;
  const property2 = getPropertyBySlug(
    "mediterranean_avenue",
    properties
  ) as Property;

  try {
    console.clear();

    user = buyProperty(user, property);
    user = buyProperty(user, property2);

    user = buyHouse(user, property, properties);
    user = buyHouse(user, property2, properties);
    user = buyHouse(user, property, properties);
    user = buyHouse(user, property2, properties);
    user = buyHouse(user, property, properties);
    user = buyHouse(user, property2, properties);
    user = buyHouse(user, property, properties);
    user = buyHouse(user, property2, properties);

    user = buyHotel(user, property, properties);
    user = buyHotel(user, property2, properties);

    console.log(user);
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

function threePropertyTest() {
  const property = getPropertyBySlug("oriental_avenue", properties) as Property;
  const property2 = getPropertyBySlug("vermont_avenue", properties) as Property;
  const property3 = getPropertyBySlug(
    "connecticut_avenue",
    properties
  ) as Property;

  try {
    console.clear();
    user = buyProperty(user, property);
    user = buyProperty(user, property2);
    user = buyProperty(user, property3);

    user = buyHouse(user, property, properties);
    user = buyHouse(user, property2, properties);
    user = buyHouse(user, property3, properties);
    user = buyHouse(user, property, properties);
    user = buyHouse(user, property2, properties);
    user = buyHouse(user, property3, properties);
    user = buyHouse(user, property, properties);
    user = buyHouse(user, property2, properties);
    user = buyHouse(user, property3, properties);
    user = buyHouse(user, property, properties);
    user = buyHouse(user, property2, properties);
    user = buyHouse(user, property3, properties);
    // built 4 houses on each property

    user = buyHotel(user, property, properties);
    user = buyHotel(user, property2, properties);
    user = buyHotel(user, property3, properties);

    user = sellHotel(user, property3);

    console.log(user.properties);
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

twoPropertyTest();
