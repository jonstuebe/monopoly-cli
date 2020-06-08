import { SpaceTypes, PropertyGroups } from "./enums";

export interface User {
  readonly name: string;
  readonly bot: boolean;
  readonly money: number;
  readonly properties: UserProperty[];
  readonly railroads: UserRailroad[];
  readonly utilities: UserUtility[];
}

export interface UserProperty extends Property {
  readonly houses: number;
  readonly hotel: boolean;
  readonly mortgaged: boolean;
}

export interface Utility {}
export interface UserUtility extends Utility {
  readonly mortgaged: boolean;
}

export interface Property {
  readonly type: SpaceTypes;
  readonly spaceId: SpaceId;
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

export interface UserRailroad extends Railroad {
  readonly mortgaged: boolean;
}

export type SpaceId =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39;
