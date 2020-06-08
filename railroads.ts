import { snakeCase } from "lodash";

import {
  earnedMoney,
  canAfford,
  spendMoney,
  getUserRailroadByRailroad,
} from "./user";
import { throwIfError } from "./utils";

import { SpaceTypes } from "./enums";
import { Railroad, User, UserRailroad } from "./types";

export function getRailroadBySlug(
  slug: string,
  railroads: Railroad[]
): Railroad | Error {
  const railroad = railroads.find((p) => p.slug === slug);
  if (railroad) {
    return railroad;
  }

  return new Error("Railroad not found");
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

export function buyRailroad(user: User, railroad: Railroad): User {
  throwIfError(canAfford, user, railroad.cost, "railroad");

  return {
    ...spendMoney(user, railroad.cost),
    railroads: [...user.railroads, { ...railroad, mortgaged: false }],
  };
}

// @todo sell to another user
// export function sellRailroad(sellingUser: User, buyingUser: User): [User, User] {}

export function unmortgageRailroad(user: User, railroad: Railroad): User {
  throwIfError(canUnmortgageRailroad, user, railroad);

  const userRailroad = throwIfError<UserRailroad>(
    getUserRailroadByRailroad,
    user,
    railroad
  );

  return {
    ...spendMoney(user, calculateUnmortgage(userRailroad)),
    railroads: user.railroads.map((p) => {
      if (p.slug === railroad.slug) {
        return {
          ...p,
          mortgaged: false,
        };
      }

      return p;
    }),
  };
}

export function mortgageRailroad(user: User, railroad: Railroad): User {
  throwIfError(canMortgageRailroad, user, railroad);

  return {
    ...earnedMoney(user, railroad.mortgageValue),
    railroads: user.railroads.map((r) => {
      if (r.slug === railroad.slug) {
        return {
          ...r,
          mortgaged: true,
        };
      }

      return r;
    }),
  };
}

export const mortgageInterest = 0.1; // 10% interest
export function calculateUnmortgage(userRailroad: UserRailroad): number {
  return Math.round(userRailroad.mortgageValue * (1 + mortgageInterest));
}

export function canUnmortgageRailroad(
  user: User,
  railroad: Railroad
): true | Error {
  const userRailroad = getUserRailroadByRailroad(user, railroad);

  if (userRailroad instanceof Error) {
    return userRailroad;
  }

  if (userRailroad.mortgaged === false)
    return new Error("Railroad is not mortgaged");

  throwIfError(
    canAfford,
    user,
    calculateUnmortgage(userRailroad),
    "unmortgage"
  );

  return true;
}

export function canMortgageRailroad(
  user: User,
  railroad: Railroad
): true | Error {
  const userRailroad = getUserRailroadByRailroad(user, railroad);

  if (userRailroad instanceof Error) {
    return userRailroad;
  }

  if (userRailroad.mortgaged === true) {
    return new Error("Railroad is already mortgaged");
  }

  return true;
}

export const railroads: Railroad[] = [
  createRailroad("Reading Railroad", 0),
  createRailroad("Pennsylvania Railroad", 1),
  createRailroad("B. & O. Railroad", 2),
  createRailroad("Short Line", 3),
];
