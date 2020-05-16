import { find, snakeCase } from "lodash";

import { SpaceTypes } from "./enums";

export interface Railroad {
  name: string;
  type: SpaceTypes;
  slug: string;
  order: number;
  cost: number;
  rentValues: [number, number, number, number];
  mortgageValue: number;
}

export function getRailroadBySlug(slug: string, railroad: Railroad[]) {
  return find(railroad, { slug });
}

export function createRailroad(name: string, order: number): Railroad {
  return {
    name,
    slug: snakeCase(name),
    type: SpaceTypes.RAILROAD,
    order,
    cost: 200,
    rentValues: [25, 50, 100, 200],
    mortgageValue: 100,
  };
}

export const railroads: Railroad[] = [
  createRailroad("Reading Railroad", 0),
  createRailroad("Pennsylvania Railroad", 1),
  createRailroad("B. & O. Railroad", 2),
  createRailroad("Short Line", 3),
];
