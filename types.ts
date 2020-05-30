import { SpaceTypes, PropertyGroups } from "./enums";

export interface User {
  readonly name: string;
  readonly bot: boolean;
  readonly money: number;
  readonly properties: UserProperty[];
  readonly railroads: Railroad[];
  readonly utilities: Utility[];
}

export interface UserProperty extends Property {
  readonly houses: number;
  readonly hotel: boolean;
  readonly mortgaged: boolean;
}

export interface Utility {}

export interface Property {
  readonly type: SpaceTypes;
  readonly name: string;
  readonly slug: string;
  readonly groupId: PropertyGroups;
  readonly groupOrder: 0 | 1 | 2;
  readonly cost: number;
  readonly rentValues: [number, number, number, number, number, number];
  readonly buildingCost: number;
  readonly mortgageValue: number;
}

export interface Railroad {
  readonly name: string;
  readonly type: SpaceTypes;
  readonly slug: string;
  readonly order: number;
  readonly cost: number;
  readonly rentValues: [number, number, number, number];
  readonly mortgageValue: number;
}
