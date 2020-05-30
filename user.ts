import { getGroupPropertyCount } from "./properties";

import { Property, User, UserProperty } from "./types";

export function createUser(name: string, bot = false): User {
  return {
    name,
    bot,
    money: 1500,
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
  if (!userProperty) return new Error("user not found");
  return userProperty;
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
  type: "property" | "house" | "hotel" | "railroad" | "utility" | "rent"
): true | Error {
  if (user.money - amount >= 0) return true;
  if (type === "rent") return new BankruptError("you can't afford this rent.");
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

export function earnedMoney(user: User, amount: number): User {
  return {
    ...user,
    money: user.money + amount,
  };
}
