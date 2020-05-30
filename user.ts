import { getGroupPropertyCount } from "./properties";

import { Property, User, UserProperty, Railroad, UserRailroad } from "./types";

export const startingMoney = 1500;

export function createUser(name: string, bot = false): User {
  return {
    name,
    bot,
    money: startingMoney,
    properties: [],
    railroads: [],
    utilities: [],
  };
}

export function getUserPropertyByProperty(
  user: User,
  property: Property
): UserProperty | Error {
  const userProperty = user.properties.find((p) => p.slug === property.slug);
  if (!userProperty) return new Error("user does not own property");
  return userProperty;
}

// @todo needs-test
export function getUserRailroadByRailroad(
  user: User,
  railroad: Railroad
): UserRailroad | Error {
  const userRailroad = user.railroads.find((p) => p.slug === railroad.slug);
  if (!userRailroad) return new Error("user does not own railroad");
  return userRailroad;
}

export class BankruptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BankruptError";
  }
}

export function canAfford(
  user: User,
  amount: number,
  type:
    | "property"
    | "house"
    | "hotel"
    | "railroad"
    | "utility"
    | "rent"
    | "unmortgage"
): true | Error {
  if (user.money - amount >= 0) return true;

  switch (type) {
    case "unmortgage":
      return new Error("you can't afford to unmortgage this property");
    case "rent":
      return new BankruptError("you can't afford this rent");
    default:
      return new Error(`you can't afford to buy this ${type}`);
  }
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

export function earnedMoney(user: User, amount: number): User {
  return {
    ...user,
    money: user.money + amount,
  };
}
