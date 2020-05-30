import {
  getRailroadBySlug,
  createRailroad,
  buyRailroad,
  railroads,
} from "./railroads";
import { createUser, spendMoney } from "./user";

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
