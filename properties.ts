import { find, snakeCase } from "lodash";

import { PropertyGroups, SpaceTypes } from "./enums";

export interface Property {
  type: SpaceTypes;
  name: string;
  slug: string;
  groupId: PropertyGroups;
  groupOrder: 0 | 1 | 2;
  cost: number;
  rentValues: [number, number, number, number, number, number];
  buildingCost: number;
  mortgageValue: number;
}

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
