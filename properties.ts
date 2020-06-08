import { find, snakeCase } from "lodash";

import {
  canAfford,
  earnedMoney,
  spendMoney,
  getUserPropertyByProperty,
  ownsProperty,
} from "./user";
import { throwIfError } from "./utils";

import { PropertyGroups, SpaceTypes } from "./enums";
import { SpaceId, Property, UserProperty, User } from "./types";

export function getPropertyBySlug(
  slug: string,
  properties: Property[]
): Property | Error {
  const property = properties.find((p) => p.slug === slug);
  if (property) {
    return property;
  }

  return new Error("Property not found");
}

export function getGroupPropertyCount(
  groupId: string,
  properties: Property[]
): Error | number {
  const groupProperties = properties.filter((p) => p.groupId === groupId);

  if (groupProperties.length === 0) {
    return new Error("Group not found");
  }

  return groupProperties.length;
}

export function createProperty({
  name,
  spaceId,
  groupId,
  groupOrder,
  cost,
  rentValues,
  buildingCost,
  mortgageValue,
}: {
  name: string;
  spaceId: SpaceId;
  groupId: PropertyGroups;
  groupOrder: 0 | 1 | 2;
  cost: number;
  rentValues: [number, number, number, number, number, number];
  buildingCost: number;
  mortgageValue: number;
}): Property {
  return {
    type: SpaceTypes.PROPERTY,
    spaceId,
    slug: snakeCase(name),
    name,
    cost,
    groupId,
    groupOrder,
    rentValues,
    buildingCost,
    mortgageValue,
  };
}

export function buyProperty(user: User, property: Property): User {
  if (ownsProperty(user, property) === true) {
    throw new Error("user already owns property");
  }

  throwIfError(canAfford, user, property.cost, "property");

  return {
    ...spendMoney(user, property.cost),
    properties: [
      ...user.properties,
      { ...property, houses: 0, hotel: false, mortgaged: false },
    ],
  };
}

// @todo sell to another user
// @todo needs-test
// export function sellProperty(sellingUser: User, buyingUser: User): [User, User] {}

export function unmortgageProperty(user: User, property: Property): User {
  throwIfError(canUnmortgageProperty, user, property);

  return {
    ...spendMoney(user, calculateUnmortgage(property)),
    properties: user.properties.map((p) => {
      if (p.slug === property.slug) {
        return {
          ...p,
          mortgaged: false,
        };
      }

      return p;
    }),
  };
}

export const mortgageInterest = 0.1; // 10% interest
// @todo needs-test
export function calculateUnmortgage(property: Property): number {
  return property.mortgageValue * (1 + mortgageInterest);
}

// @todo needs-test
export function canUnmortgageProperty(
  user: User,
  property: Property
): true | Error {
  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  if (userProperty.mortgaged === false)
    return new Error("Property is not mortgaged");

  throwIfError(canAfford, user, calculateUnmortgage(property), "unmortgage");

  return true;
}

// @todo needs-test
export function mortgageProperty(user: User, property: Property): User {
  throwIfError(canMortgageProperty, user, property);

  return {
    ...earnedMoney(user, property.mortgageValue),
    properties: user.properties.map((p) => {
      if (p.slug === property.slug) {
        return {
          ...p,
          mortgaged: true,
        };
      }

      return p;
    }),
  };
}

// @todo needs-test
export function canMortgageProperty(
  user: User,
  property: Property
): true | Error {
  const userProperty = throwIfError<UserProperty>(
    getUserPropertyByProperty,
    user,
    property
  );

  if (userProperty.houses > 0 || userProperty.hotel === true) {
    return new Error(
      "you must sell hotels & houses before mortgaging the property"
    );
  }

  return true;
}

export const properties: Property[] = [
  createProperty({
    name: "Mediterranean Avenue",
    spaceId: 1,
    groupId: PropertyGroups.BROWN,
    groupOrder: 0,
    cost: 60,
    rentValues: [2, 10, 30, 90, 160, 250],
    buildingCost: 50,
    mortgageValue: 30,
  }),
  createProperty({
    name: "Baltic Avenue",
    spaceId: 3,
    groupId: PropertyGroups.BROWN,
    groupOrder: 1,
    cost: 60,
    rentValues: [4, 20, 60, 180, 320, 450],
    buildingCost: 50,
    mortgageValue: 30,
  }),
  createProperty({
    name: "Oriental Avenue",
    spaceId: 6,
    groupId: PropertyGroups.LIGHT_BLUE,
    groupOrder: 0,
    cost: 100,
    rentValues: [6, 30, 90, 270, 400, 550],
    buildingCost: 50,
    mortgageValue: 50,
  }),
  createProperty({
    name: "Vermont Avenue",
    spaceId: 8,

    groupId: PropertyGroups.LIGHT_BLUE,
    groupOrder: 1,
    cost: 100,
    rentValues: [6, 30, 90, 270, 400, 550],
    buildingCost: 50,
    mortgageValue: 50,
  }),
  createProperty({
    name: "Connecticut Avenue",
    spaceId: 9,
    groupId: PropertyGroups.LIGHT_BLUE,
    groupOrder: 2,
    cost: 120,
    rentValues: [8, 40, 100, 300, 450, 600],
    buildingCost: 50,
    mortgageValue: 60,
  }),

  createProperty({
    name: "St. Charles Place",
    spaceId: 11,
    groupId: PropertyGroups.PINK,
    groupOrder: 0,
    cost: 140,
    rentValues: [10, 50, 150, 450, 625, 750],
    buildingCost: 100,
    mortgageValue: 70,
  }),
  createProperty({
    name: "States Avenue",
    spaceId: 13,
    groupId: PropertyGroups.PINK,
    groupOrder: 1,
    cost: 140,
    rentValues: [10, 50, 150, 450, 625, 750],
    buildingCost: 100,
    mortgageValue: 70,
  }),
  createProperty({
    name: "Virginia Avenue",
    spaceId: 14,
    groupId: PropertyGroups.PINK,
    groupOrder: 2,
    cost: 160,
    rentValues: [12, 60, 180, 500, 700, 900],
    buildingCost: 100,
    mortgageValue: 80,
  }),

  createProperty({
    name: "St. James Place",
    spaceId: 16,
    groupId: PropertyGroups.ORANGE,
    groupOrder: 0,
    cost: 180,
    rentValues: [15, 70, 200, 550, 750, 950],
    buildingCost: 100,
    mortgageValue: 90,
  }),
  createProperty({
    name: "Tennessee Avenue",
    spaceId: 18,
    groupId: PropertyGroups.ORANGE,
    groupOrder: 1,
    cost: 180,
    rentValues: [14, 70, 200, 550, 750, 950],
    buildingCost: 100,
    mortgageValue: 90,
  }),
  createProperty({
    name: "New York Avenue",
    spaceId: 19,
    groupId: PropertyGroups.ORANGE,
    groupOrder: 2,
    cost: 200,
    rentValues: [16, 80, 220, 600, 800, 1000],
    buildingCost: 100,
    mortgageValue: 100,
  }),

  createProperty({
    name: "Kentucky Avenue",
    spaceId: 21,
    groupId: PropertyGroups.RED,
    groupOrder: 0,
    cost: 220,
    rentValues: [18, 90, 250, 700, 875, 1050],
    buildingCost: 150,
    mortgageValue: 110,
  }),
  createProperty({
    name: "Indiana Avenue",
    spaceId: 23,
    groupId: PropertyGroups.RED,
    groupOrder: 1,
    cost: 220,
    rentValues: [18, 90, 250, 700, 875, 1050],
    buildingCost: 150,
    mortgageValue: 110,
  }),
  createProperty({
    name: "Illinois Avenue",
    spaceId: 24,
    groupId: PropertyGroups.RED,
    groupOrder: 2,
    cost: 240,
    rentValues: [20, 100, 300, 750, 925, 1100],
    buildingCost: 150,
    mortgageValue: 120,
  }),

  createProperty({
    name: "Atlantic Avenue",
    spaceId: 26,
    groupId: PropertyGroups.YELLOW,
    groupOrder: 0,
    cost: 260,
    rentValues: [22, 110, 330, 800, 975, 1150],
    buildingCost: 150,
    mortgageValue: 130,
  }),
  createProperty({
    name: "Ventnor Avenue",
    spaceId: 27,
    groupId: PropertyGroups.YELLOW,
    groupOrder: 1,
    cost: 260,
    rentValues: [22, 110, 330, 800, 975, 1150],
    buildingCost: 150,
    mortgageValue: 130,
  }),
  createProperty({
    name: "Marvin Gardens",
    spaceId: 29,
    groupId: PropertyGroups.YELLOW,
    groupOrder: 2,
    cost: 280,
    rentValues: [24, 120, 360, 850, 1025, 1200],
    buildingCost: 150,
    mortgageValue: 140,
  }),

  createProperty({
    name: "Pacific Avenue",
    spaceId: 31,
    groupId: PropertyGroups.GREEN,
    groupOrder: 0,
    cost: 300,
    rentValues: [26, 130, 390, 900, 1100, 1275],
    buildingCost: 200,
    mortgageValue: 150,
  }),
  createProperty({
    name: "North Carolina Avenue",
    spaceId: 32,
    groupId: PropertyGroups.GREEN,
    groupOrder: 1,
    cost: 300,
    rentValues: [26, 130, 390, 900, 1100, 1275],
    buildingCost: 200,
    mortgageValue: 150,
  }),
  createProperty({
    name: "Pennsylvania Avenue",
    spaceId: 34,
    groupId: PropertyGroups.GREEN,
    groupOrder: 2,
    cost: 320,
    rentValues: [28, 150, 450, 1000, 1200, 1400],
    buildingCost: 200,
    mortgageValue: 160,
  }),

  createProperty({
    name: "Park Place",
    spaceId: 37,
    groupId: PropertyGroups.DARK_BLUE,
    groupOrder: 0,
    cost: 350,
    rentValues: [35, 175, 500, 1100, 1300, 1500],
    buildingCost: 200,
    mortgageValue: 175,
  }),
  createProperty({
    name: "Boardwalk",
    spaceId: 39,
    groupId: PropertyGroups.DARK_BLUE,
    groupOrder: 1,
    cost: 400,
    rentValues: [50, 200, 600, 1400, 1700, 2000],
    buildingCost: 200,
    mortgageValue: 200,
  }),
];
