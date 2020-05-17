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

export function purchaseProperty(user: User, property: Property): User {
  throwIfError(canAfford, user, property.cost, "property");

  return {
    ...user,
    money: user.money - property.cost,
    properties: [...user.properties, { ...property, houses: 0, hotel: false }],
  };
}

function getUserPropertyByProperty(
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

export function canBuildHotel(
  user: User,
  property: Property,
  properties: Property[]
): true | Error {
  const userProperty = getUserPropertyByProperty(user, property);
  if (userProperty instanceof Error) {
    return userProperty;
  }

  const userCanAfford = canAfford(user, property.buildingCost, "house");
  if (userCanAfford instanceof Error) {
    return userCanAfford;
  }

  const userOwnsGroup = ownsGroup(user, userProperty, properties);
  if (userOwnsGroup instanceof Error) {
    return userOwnsGroup;
  }

  if (userProperty.hotel) {
    return new Error("you've already purchased a hotel for this property");
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

export function canBuildHouse(
  user: User,
  property: Property,
  properties: Property[]
): true | Error {
  const userProperty = getUserPropertyByProperty(user, property);
  if (userProperty instanceof Error) {
    return userProperty;
  }

  const userCanAfford = canAfford(user, property.buildingCost, "house");
  if (userCanAfford instanceof Error) {
    return userCanAfford;
  }

  const numHouses = userProperty.houses;

  if (numHouses === 4) {
    return new Error("you already have 4 houses on this property");
  }

  const userOwnsGroup = ownsGroup(user, userProperty, properties);
  if (userOwnsGroup instanceof Error) {
    return userOwnsGroup;
  }

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
          throw new Error("incorrect property house count");
      }

    default:
      return new Error("you are not allowed to build a house on this property");
  }
}

export function purchaseHouse(
  user: User,
  property: Property,
  properties: Property[]
): User {
  throwIfError(canBuildHouse, user, property, properties);

  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  return {
    ...user,
    money: user.money - userProperty.buildingCost,
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

export function purchaseHotel(
  user: User,
  property: Property,
  properties: Property[]
): User {
  throwIfError(canBuildHotel, user, property, properties);

  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  return {
    ...user,
    money: user.money - userProperty.buildingCost,
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

// export const user: User = {
//   name: "Jon",
//   bot: false,
//   spaces: [
//     { slug: "mediterranean_avenue", houses: 0, hotel: false },
//     { slug: "baltic_avenue", houses: 0, hotel: false },
//     { slug: "short_line" },
//   ],
// };
