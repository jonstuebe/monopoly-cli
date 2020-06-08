import faker from "faker";
import {
  canAfford,
  createUser,
  spendMoney,
  earnedMoney,
  startingMoney,
  getUserPropertyByProperty,
  getUserRailroadByRailroad,
  BankruptError,
  ownsGroup,
} from "./user";
import { properties, buyProperty } from "./properties";
import { buyRailroad, railroads } from "./railroads";

describe("createUser", () => {
  it("returns a non bot user", () => {
    expect(createUser("Jerry")).toEqual({
      name: "Jerry",
      bot: false,
      money: startingMoney,
      properties: [],
      railroads: [],
      utilities: [],
    });
  });

  it("returns a non bot user", () => {
    expect(createUser("Tom", true)).toEqual({
      name: "Tom",
      bot: true,
      money: startingMoney,
      properties: [],
      railroads: [],
      utilities: [],
    });
  });
});

describe("getUserPropertyByProperty", () => {
  it("returns an error", () => {
    const user = createUser("Jerry");
    expect(getUserPropertyByProperty(user, properties[0])).toEqual(
      new Error("user does not own property")
    );
  });
  it("returns an UserProperty", () => {
    let user = createUser("Jerry");
    user = buyProperty(user, properties[0]);
    expect(getUserPropertyByProperty(user, properties[0])).toEqual({
      ...properties[0],
      mortgaged: false,
      houses: 0,
      hotel: false,
    });
  });
});

describe("getUserRailroadByRailroad", () => {
  it("returns an error", () => {
    const user = createUser("James");
    const railroad = railroads[0];

    expect(getUserRailroadByRailroad(user, railroad)).toEqual(
      new Error("user does not own railroad")
    );
  });
  it("returns a UserRailroad", () => {
    let user = createUser("James");
    const railroad = railroads[0];
    user = buyRailroad(user, railroad);

    expect(getUserRailroadByRailroad(user, railroad)).toEqual({
      name: "Reading Railroad",
      slug: "reading_railroad",
      type: "railroad",
      order: 0,
      cost: 200,
      rentValues: [25, 50, 100, 200],
      mortgageValue: 100,
      mortgaged: false,
    });
  });
});

describe("spendMoney", () => {
  it("returns true", () => {
    const user = createUser("Jerry");
    expect(spendMoney(user, 1200)).toEqual({
      ...user,
      money: user.money - 1200,
    });
  });
});

describe("BankruptError", () => {
  it("has the correct name", () => {
    const error = new BankruptError("test");
    expect(error.name).toEqual("BankruptError");
  });

  it("returns the correct message", () => {
    const error = new BankruptError("test");
    expect(error.message).toEqual("test");
  });
});

describe("ownsGroup", () => {
  it("returns an error", () => {
    let user = createUser("Jerry");

    user = buyProperty(user, properties[0]);

    expect(ownsGroup(user, user.properties[0], properties)).toEqual(
      new Error("you don't own all of the properties for this group yet")
    );
  });
  it("returns true", () => {
    let user = createUser("Jerry");

    user = buyProperty(user, properties[0]);
    user = buyProperty(user, properties[1]);

    expect(ownsGroup(user, user.properties[0], properties)).toBeTruthy();
  });
});

describe("earnedMoney", () => {
  it("returns the user with money added", () => {
    const user = createUser("Jerry");
    expect(earnedMoney(user, 200)).toEqual({
      ...user,
      money: user.money + 200,
    });
  });
});

describe("canAfford", () => {
  it("returns an property error", () => {
    let user = createUser("Jerry");
    user = spendMoney(user, 1500);
    const types = ["property", "house", "hotel", "railroad", "utility"];

    types.forEach((type: any) => {
      expect(canAfford(user, faker.random.number(200), type)).toEqual(
        new Error(`you can't afford to buy this ${type}`)
      );
    });

    expect(canAfford(user, 15, "rent")).toEqual(
      new BankruptError("you can't afford this rent")
    );
    expect(canAfford(user, 220, "unmortgage")).toEqual(
      new Error("you can't afford to unmortgage this property")
    );
  });

  it("returns true", () => {
    let user = createUser("Jerry");

    expect(canAfford(user, 1200, "property")).toBeTruthy();

    expect(user.money).toEqual(startingMoney);
    // make sure that it hasn't changed the amount of money

    user = spendMoney(user, 1200);

    expect(canAfford(user, 1200, "property")).toEqual(
      new Error("you can't afford to buy this property")
    );
  });
});
