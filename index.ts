import { getPropertyBySlug, properties, Property } from "./properties";
import {
  createUser,
  buyProperty,
  buyHouse,
  buyHotel,
  sellHouse,
  sellHotel,
  isBuildAllowed,
  getUserPropertyByProperty,
  User,
  UserProperty,
} from "./user";
import { throwIfError } from "./utils";

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
  console.error("Error: ", error.message);
}
