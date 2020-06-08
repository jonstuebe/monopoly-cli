import {
  getRailroadBySlug,
  createRailroad,
  buyRailroad,
  railroads,
  mortgageRailroad,
  unmortgageRailroad,
  calculateUnmortgage,
  mortgageInterest,
  canUnmortgageRailroad,
  canMortgageRailroad,
} from "./railroads";
import { createUser, spendMoney, getUserRailroadByRailroad } from "./user";

import { UserRailroad } from "./types";

describe("createRailroad", () => {
  it("returns a created Railroad", () => {
    expect(createRailroad("Reading Railroad", 0)).toEqual({
      cost: 200,
      mortgageValue: 100,
      name: "Reading Railroad",
      order: 0,
      rentValues: [25, 50, 100, 200],
      slug: "reading_railroad",
      type: "railroad",
    });

    expect(createRailroad("B&0 Railroad", 1)).toEqual({
      cost: 200,
      mortgageValue: 100,
      name: "B&0 Railroad",
      order: 1,
      rentValues: [25, 50, 100, 200],
      slug: "b_0_railroad",
      type: "railroad",
    });
  });
});

describe("getRailroadBySlug", () => {
  it("returns an error", () => {
    expect(getRailroadBySlug("test", railroads)).toEqual(
      new Error("Railroad not found")
    );
  });

  it("returns the railroad", () => {
    expect(getRailroadBySlug("reading_railroad", railroads)).toEqual({
      cost: 200,
      mortgageValue: 100,
      name: "Reading Railroad",
      order: 0,
      rentValues: [25, 50, 100, 200],
      slug: "reading_railroad",
      type: "railroad",
    });
  });
});

describe("buyRailroad", () => {
  it("throws an error", () => {
    let user = createUser("Jim");
    user = spendMoney(user, 1500);
    expect(() => buyRailroad(user, railroads[0])).toThrowError(
      "you can't afford to buy this railroad"
    );
  });

  it("successfully buys a railroad", () => {
    let user = createUser("Jim");
    expect(buyRailroad(user, railroads[0])).toEqual({
      ...spendMoney(user, railroads[0].cost),
      railroads: [
        {
          ...railroads[0],
          mortgaged: false,
        },
      ],
    });
  });
});

describe("railroads", () => {
  expect(railroads.length).toBe(4);
  // always make sure we have 4 railroads
});

describe("mortgageInterest", () => {
  it("returns 10% in decimal form", () => {
    expect(mortgageInterest).toEqual(0.1);
  });
});

describe("calculateUnmortgage", () => {
  it("returns the unmortgaged value", () => {
    let user = createUser("James");
    const railroad = railroads[0];

    user = buyRailroad(user, railroad);
    const userRailroad = getUserRailroadByRailroad(
      user,
      railroad
    ) as UserRailroad;

    expect(calculateUnmortgage(userRailroad)).toEqual(110);
  });
});

describe("canUnmortgageRailroad", () => {
  it("returns an error", () => {
    let user = createUser("James");
    const railroad = railroads[0];

    expect(canUnmortgageRailroad(user, railroad)).toEqual(
      new Error("user does not own railroad")
    );

    user = buyRailroad(user, railroad);

    expect(canUnmortgageRailroad(user, railroad)).toEqual(
      new Error("Railroad is not mortgaged")
    );
  });
  it("returns true", () => {
    let user = createUser("James");
    const railroad = railroads[0];

    user = buyRailroad(user, railroad);
    user = mortgageRailroad(user, railroad);

    expect(canUnmortgageRailroad(user, railroad)).toBeTruthy();
  });
});

describe("canMortgageRailroad", () => {
  it("returns an error", () => {
    let user = createUser("James");
    const railroad = railroads[0];

    expect(canMortgageRailroad(user, railroad)).toEqual(
      new Error("user does not own railroad")
    );

    user = buyRailroad(user, railroad);
    user = mortgageRailroad(user, railroad);

    expect(canMortgageRailroad(user, railroad)).toEqual(
      new Error("Railroad is already mortgaged")
    );
  });
  it("returns true", () => {
    let user = createUser("James");
    const railroad = railroads[0];

    user = buyRailroad(user, railroad);

    expect(canMortgageRailroad(user, railroad)).toBeTruthy();
  });
});

describe("mortgageRailroad", () => {
  it("throws an error", () => {
    let user = createUser("James");
    const railroad = railroads[0];

    expect(() => mortgageRailroad(user, railroad)).toThrowError();

    user = buyRailroad(user, railroad);

    expect(user.money).toEqual(1300);
    expect(() => mortgageRailroad(user, railroad)).not.toThrowError();
  });
  it("correctly mortgages railroad", () => {
    let user = createUser("James");
    const railroad = railroads[0];

    user = buyRailroad(user, railroad);

    expect(user.money).toEqual(1300);
    expect(getUserRailroadByRailroad(user, railroad)).toEqual({
      cost: 200,
      mortgageValue: 100,
      mortgaged: false,
      name: "Reading Railroad",
      order: 0,
      rentValues: [25, 50, 100, 200],
      slug: "reading_railroad",
      type: "railroad",
    });

    user = mortgageRailroad(user, railroad);

    expect(user.money).toEqual(1400);
    expect(getUserRailroadByRailroad(user, railroad)).toEqual({
      cost: 200,
      mortgageValue: 100,
      mortgaged: true,
      name: "Reading Railroad",
      order: 0,
      rentValues: [25, 50, 100, 200],
      slug: "reading_railroad",
      type: "railroad",
    });
  });
});

describe("unmortgageRailroad", () => {
  it("throws an error", () => {
    let user = createUser("James");
    const railroad = railroads[0];

    expect(() => unmortgageRailroad(user, railroad)).toThrowError();

    user = buyRailroad(user, railroad);

    expect(() => unmortgageRailroad(user, railroad)).toThrowError();
  });
  it("correctly unmortgages railroad", () => {
    let user = createUser("James");
    const railroad = railroads[0];

    user = buyRailroad(user, railroad);

    expect(user.money).toEqual(1300);
    expect(getUserRailroadByRailroad(user, railroad)).toEqual({
      cost: 200,
      mortgageValue: 100,
      mortgaged: false,
      name: "Reading Railroad",
      order: 0,
      rentValues: [25, 50, 100, 200],
      slug: "reading_railroad",
      type: "railroad",
    });

    user = mortgageRailroad(user, railroad);

    expect(user.money).toEqual(1400);
    expect(getUserRailroadByRailroad(user, railroad)).toEqual({
      cost: 200,
      mortgageValue: 100,
      mortgaged: true,
      name: "Reading Railroad",
      order: 0,
      rentValues: [25, 50, 100, 200],
      slug: "reading_railroad",
      type: "railroad",
    });

    user = unmortgageRailroad(user, railroad);

    expect(user.money).toEqual(1290);
    expect(getUserRailroadByRailroad(user, railroad)).toEqual({
      cost: 200,
      mortgageValue: 100,
      mortgaged: false,
      name: "Reading Railroad",
      order: 0,
      rentValues: [25, 50, 100, 200],
      slug: "reading_railroad",
      type: "railroad",
    });
  });
});
