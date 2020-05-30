import { find, snakeCase } from "lodash";

import {
  canAfford,
  earnedMoney,
  spendMoney,
  getUserPropertyByProperty,
} from "./user";
import { throwIfError } from "./utils";

import { PropertyGroups, SpaceTypes } from "./enums";
import { Property, UserProperty, User } from "./types";

export function getPropertyBySlug(slug: string, properties: Property[]) {
  return find(properties, { slug });
}

export function getPropertiesByGroupId(
  groupId: PropertyGroups,
  properties: Property[]
) {
  return properties.filter((property) => {
    return property.groupId === groupId;
  });
}

export function getGroupPropertyCount(
  groupId: string,
  properties: Property[]
): number {
  return properties.filter((p) => p.groupId === groupId).length;
}

export function createProperty(
  name: string,
  groupId: PropertyGroups,
  groupOrder: 0 | 1 | 2,
  cost: number,
  rentValues: [number, number, number, number, number, number],
  buildingCost: number,
  mortgageValue: number
): Property {
  return {
    type: SpaceTypes.PROPERTY,
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
  throwIfError(canAfford, user, property.cost, "property");

  return {
    ...spendMoney(user, property.cost),
    properties: [
      ...user.properties,
      { ...property, houses: 0, hotel: false, mortgaged: false },
    ],
  };
}

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
export function calculateUnmortgage(property: Property): number {
  return property.mortgageValue * (1 + mortgageInterest);
}

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

export const properties: Property[] = [
  createProperty(
    "Mediterranean Avenue",
    PropertyGroups.BROWN,
    0,
    60,
    [2, 10, 30, 90, 160, 250],
    50,
    30
  ),
  createProperty(
    "Baltic Avenue",
    PropertyGroups.BROWN,
    1,
    60,
    [4, 20, 60, 180, 320, 450],
    50,
    30
  ),
  createProperty(
    "Oriental Avenue",
    PropertyGroups.LIGHT_BLUE,
    0,
    100,
    [6, 30, 90, 270, 400, 550],
    50,
    50
  ),
  createProperty(
    "Vermont Avenue",
    PropertyGroups.LIGHT_BLUE,
    1,
    100,
    [6, 30, 90, 270, 400, 550],
    50,
    50
  ),
  createProperty(
    "Connecticut Avenue",
    PropertyGroups.LIGHT_BLUE,
    2,
    120,
    [8, 40, 100, 300, 450, 600],
    50,
    60
  ),

  createProperty(
    "St. Charles Place",
    PropertyGroups.PINK,
    0,
    140,
    [10, 50, 150, 450, 625, 750],
    100,
    70
  ),
  createProperty(
    "States Avenue",
    PropertyGroups.PINK,
    1,
    140,
    [10, 50, 150, 450, 625, 750],
    100,
    70
  ),
  createProperty(
    "Virginia Avenue",
    PropertyGroups.PINK,
    2,
    160,
    [12, 60, 180, 500, 700, 900],
    100,
    80
  ),

  createProperty(
    "St. James Place",
    PropertyGroups.ORANGE,
    0,
    180,
    [15, 70, 200, 550, 750, 950],
    100,
    90
  ),
  createProperty(
    "Tennessee Avenue",
    PropertyGroups.ORANGE,
    1,
    180,
    [14, 70, 200, 550, 750, 950],
    100,
    90
  ),
  createProperty(
    "New York Avenue",
    PropertyGroups.ORANGE,
    2,
    200,
    [16, 80, 220, 600, 800, 1000],
    100,
    100
  ),

  createProperty(
    "Kentucky Avenue",
    PropertyGroups.RED,
    0,
    220,
    [18, 90, 250, 700, 875, 1050],
    150,
    110
  ),
  createProperty(
    "Indiana Avenue",
    PropertyGroups.RED,
    1,
    220,
    [18, 90, 250, 700, 875, 1050],
    150,
    110
  ),
  createProperty(
    "Illinois Avenue",
    PropertyGroups.RED,
    2,
    240,
    [20, 100, 300, 750, 925, 1100],
    150,
    120
  ),

  createProperty(
    "Atlantic Avenue",
    PropertyGroups.YELLOW,
    0,
    260,
    [22, 110, 330, 800, 975, 1150],
    150,
    130
  ),
  createProperty(
    "Ventnor Avenue",
    PropertyGroups.YELLOW,
    1,
    260,
    [22, 110, 330, 800, 975, 1150],
    150,
    130
  ),
  createProperty(
    "Marvin Gardens",
    PropertyGroups.YELLOW,
    2,
    280,
    [24, 120, 360, 850, 1025, 1200],
    150,
    140
  ),

  createProperty(
    "Pacific Avenue",
    PropertyGroups.GREEN,
    0,
    300,
    [26, 130, 390, 900, 1100, 1275],
    200,
    150
  ),
  createProperty(
    "North Carolina Avenue",
    PropertyGroups.GREEN,
    1,
    300,
    [26, 130, 390, 900, 1100, 1275],
    200,
    150
  ),
  createProperty(
    "Pennsylvania Avenue",
    PropertyGroups.GREEN,
    2,
    320,
    [28, 150, 450, 1000, 1200, 1400],
    200,
    160
  ),

  createProperty(
    "Park Place",
    PropertyGroups.DARK_BLUE,
    0,
    350,
    [35, 175, 500, 1100, 1300, 1500],
    200,
    175
  ),
  createProperty(
    "Boardwalk",
    PropertyGroups.DARK_BLUE,
    1,
    400,
    [50, 200, 600, 1400, 1700, 2000],
    200,
    200
  ),
];
