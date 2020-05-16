import { getPropertyBySlug, properties, Property } from "./properties";
import {
  createUser,
  purchaseProperty,
  purchaseHouse,
  purchaseHotel,
  canBuildHouse,
  User,
} from "./user";

let numPlayers = 2;
let startingMoney = 1500;
let usersMoney = new Array(numPlayers).fill(startingMoney);

let user = createUser("Jon");

// const property = getPropertyBySlug("baltic_avenue", properties) as Property;
// const property2 = getPropertyBySlug(
//   "mediterranean_avenue",
//   properties
// ) as Property;

const property = getPropertyBySlug("oriental_avenue", properties) as Property;
const property2 = getPropertyBySlug("vermont_avenue", properties) as Property;
const property3 = getPropertyBySlug(
  "connecticut_avenue",
  properties
) as Property;

try {
  user = purchaseProperty(user, property);
  user = purchaseProperty(user, property2);
  user = purchaseProperty(user, property3);

  user = purchaseHouse(user, property, properties);
  user = purchaseHouse(user, property2, properties);
  user = purchaseHouse(user, property3, properties);
  user = purchaseHouse(user, property, properties);
  user = purchaseHouse(user, property2, properties);
  user = purchaseHouse(user, property3, properties);
  user = purchaseHouse(user, property, properties);
  user = purchaseHouse(user, property2, properties);
  user = purchaseHouse(user, property3, properties);
  user = purchaseHouse(user, property, properties);
  user = purchaseHouse(user, property2, properties);
  user = purchaseHouse(user, property3, properties);
  // built 4 houses on each property

  console.log(user);
} catch (error) {
  console.error("Error: ", error.message);
}
