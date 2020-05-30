import { throwIfError } from "./utils";
import {
  spendMoney,
  getUserPropertyByProperty,
  canAfford,
  earnedMoney,
  ownsGroup,
} from "./user";

import { User, Property, UserProperty } from "./types";

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
    ...earnedMoney(user, userProperty.buildingCost / 2),
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
    ...earnedMoney(user, userProperty.buildingCost / 2),
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
