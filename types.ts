import { SpaceTypes, PropertyGroups } from "./enums";

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

export interface Railroad {
  name: string;
  type: SpaceTypes;
  slug: string;
  order: number;
  cost: number;
  rentValues: [number, number, number, number];
  mortgageValue: number;
}
