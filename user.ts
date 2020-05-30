import { Property, getGroupPropertyCount } from "./properties";
import { addArray, throwIfError } from "./utils";

export interface User {
  readonly name: string;
  readonly bot: boolean;
  readonly money: number;
  readonly properties: UserProperty[];
}

export interface UserProperty extends Property {
  readonly houses: number;
  readonly hotel: boolean;
}

export function createUser(name: string, bot = false): User {
  return {
    name,
    bot,
    money: 1500,
    properties: [],
  };
}

export function buyProperty(user: User, property: Property): User {
  throwIfError(canAfford, user, property.cost, "property");

  return {
    ...spendMoney(user, property.cost),
    properties: [...user.properties, { ...property, houses: 0, hotel: false }],
  };
}

export function getUserPropertyByProperty(
  user: User,
  property: Property
): UserProperty | Error {
  const userProperty = user.properties.find((p) => p.slug === property.slug);
  if (!userProperty) return new Error("user not found");
  return userProperty;
}

function canAfford(
  user: User,
  amount: number,
  type: "property" | "house" | "hotel" | "railroad" | "utility"
): true | Error {
  if (user.money - amount >= 0) return true;
  return new Error(`you can't afford to buy this ${type}`);
}

export function ownsGroup(
  user: User,
  userProperty: UserProperty,
  properties: Property[]
): true | Error {
  const groupUserProperties = user.properties.filter(
    (p) => p.groupId === userProperty.groupId
  );
  const groupPropertyCount = getGroupPropertyCount(
    userProperty.groupId,
    properties
  );

  if (groupUserProperties.length !== groupPropertyCount) {
    // can't build because the user doesn't own all of the properties for this group
    return new Error("you don't own all of the properties for this group yet");
  }

  return true;
}

// values should be validated before running this function
// to make sure the user has enough money (i.e. canAfford)
export function spendMoney(user: User, amount: number): User {
  return {
    ...user,
    money: user.money - amount,
  };
}

export function addMoney(user: User, amount: number): User {
  return {
    ...user,
    money: user.money + amount,
  };
}

export function canMortgageProperty(
  user: User,
  property: Property
): true | Error {
  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  if (userProperty.houses > 0 || userProperty.hotel) {
    return new Error(
      "you must sell hotels & houses before mortgaging the property"
    );
  }

  return true;
}

export function canSellHouse(user: User, property: Property): true | Error {
  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  if (userProperty.houses === 0) {
    return new Error("you don't have any houses built on this property");
  }

  return true;
}

export function canSellHotel(user: User, property: Property): true | Error {
  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  if (!userProperty.hotel) {
    return new Error("you don't have a hotel built on this property");
  }

  return true;
}

export function canBuyHotel(
  user: User,
  property: Property,
  properties: Property[]
): true | Error {
  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  throwIfError(canAfford, user, property.buildingCost, "hotel");
  throwIfError(ownsGroup, user, userProperty, properties);

  if (userProperty.hotel) {
    return new Error("you've already buyd a hotel for this property");
  }

  if (
    user.properties
      .filter((p) => p.groupId === userProperty.groupId)
      .every((p) => p.houses === 4 || p.hotel)
  ) {
    return true;
  }

  return new Error(
    "you need to build 4 houses on each of the properties in the group before building a hotel"
  );
}

export function canBuyHouse(
  user: User,
  property: Property,
  properties: Property[]
): true | Error {
  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  throwIfError(canAfford, user, property.buildingCost, "house");

  const numHouses = userProperty.houses;

  if (numHouses === 4) {
    return new Error("Maximum number of houses have been built");
  }

  throwIfError(ownsGroup, user, userProperty, properties);

  switch (numHouses) {
    case 0:
      // user has no houses yet
      return true;
    case 1:
    case 2:
    case 3:
      const groupUserProperties = user.properties.filter(
        (p) => p.groupId === userProperty.groupId
      );

      const otherPropertiesInGroup = groupUserProperties.filter(
        (p) => p.slug !== userProperty.slug
      );

      switch (groupUserProperties.length) {
        case 2:
        case 3:
          if (
            otherPropertiesInGroup.every((p) => numHouses + 1 - p.houses <= 1)
          ) {
            return true;
          }

          return new Error("houses must be built equally");
        default:
          return new Error("incorrect property house count");
      }

    default:
      return new Error("you are not allowed to build a house on this property");
  }
}

// export function isBuildAllowed(
//   user: User,
//   userProperty: UserProperty,
//   properties: Property[],
//   add: boolean,
//   buildType: "house" | "hotel"
// ): true | Error {
//   const groupUserProperties = user.properties.filter(
//     (p) => p.groupId === userProperty.groupId
//   );

//   switch (buildType) {
//     case "house":
//       if (add === true && userProperty.houses === 4) {
//         return new Error("Maximum number of houses have been built");
//       }

//       const numHouses = add ? userProperty.houses + 1 : userProperty.houses - 1;

//       switch (groupUserProperties.length) {
//         case 2:
//         case 3:
//           console.log({ groupUserProperties });

//           if (groupUserProperties.every((p) => numHouses - p.houses <= 1)) {
//             return true;
//           }

//           return new Error("houses must be built equally");
//         default:
//           return new Error("incorrect property house count");
//       }
//     case "hotel":
//       if (add === true && !groupUserProperties.every((p) => p.houses === 4)) {
//         return new Error(
//           "You must build 4 houses on each property of the group before building hotels"
//         );
//       }

//       return true;

//     default:
//       return new Error("incorrect build type");
//   }
// }

export function buyHouse(
  user: User,
  property: Property,
  properties: Property[]
): User {
  throwIfError(canBuyHouse, user, property, properties);

  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  return {
    ...spendMoney(user, userProperty.buildingCost),
    properties: user.properties.map((p) => {
      if (p.slug === userProperty.slug) {
        return {
          ...p,
          houses: p.houses + 1,
        };
      }

      return p;
    }),
  };
}

export function sellHouse(user: User, property: Property): User {
  throwIfError(canSellHouse, user, property);

  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  return {
    ...addMoney(user, userProperty.buildingCost / 2),
    properties: user.properties.map((p) => {
      if (p.slug === userProperty.slug) {
        return {
          ...p,
          houses: p.houses - 1,
        };
      }

      return p;
    }),
  };
}

export function buyHotel(
  user: User,
  property: Property,
  properties: Property[]
): User {
  throwIfError(canBuyHotel, user, property, properties);

  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  return {
    ...spendMoney(user, userProperty.buildingCost),
    properties: user.properties.map((p) => {
      if (p.slug === userProperty.slug) {
        return {
          ...p,
          houses: 0,
          hotel: true,
        };
      }

      return p;
    }),
  };
}

export function sellHotel(user: User, property: Property): User {
  throwIfError(canSellHotel, user, property);

  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  return {
    ...addMoney(user, userProperty.buildingCost / 2),
    properties: user.properties.map((p) => {
      if (p.slug === userProperty.slug) {
        return {
          ...p,
          houses: 4,
          hotel: false,
        };
      }

      return p;
    }),
  };
}
