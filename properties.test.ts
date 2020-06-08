import {
  getPropertyBySlug,
  getGroupPropertyCount,
  createProperty,
  buyProperty,
  // sellProperty,
  unmortgageProperty,
  calculateUnmortgage,
  canUnmortgageProperty,
  mortgageProperty,
  canMortgageProperty,
  properties,
} from "./properties";
import {
  createUser,
  spendMoney,
  earnedMoney,
  getUserPropertyByProperty,
} from "./user";

import { PropertyGroups } from "./enums";

describe("getPropertyBySlug", () => {
  it("returns an error", () => {
    expect(getPropertyBySlug("test", properties)).toEqual(
      new Error("Property not found")
    );
  });
  it("returns a Property", () => {
    expect(getPropertyBySlug("pacific_avenue", properties)).toEqual({
      buildingCost: 200,
      cost: 300,
      groupId: "green",
      groupOrder: 0,
      mortgageValue: 150,
      name: "Pacific Avenue",
      rentValues: [26, 130, 390, 900, 1100, 1275],
      slug: "pacific_avenue",
      spaceId: 31,
      type: "property",
    });
  });
});

describe("getPropertiesByGroupId", () => {
  it("return an error", () => {
    expect(getGroupPropertyCount("teal", properties)).toEqual(
      new Error("Group not found")
    );
  });
  it("return the appropriate numbers for each group", () => {
    expect(getGroupPropertyCount("brown", properties)).toEqual(2);
    expect(getGroupPropertyCount("light_blue", properties)).toEqual(3);
    expect(getGroupPropertyCount("pink", properties)).toEqual(3);
    expect(getGroupPropertyCount("orange", properties)).toEqual(3);
    expect(getGroupPropertyCount("red", properties)).toEqual(3);
    expect(getGroupPropertyCount("yellow", properties)).toEqual(3);
    expect(getGroupPropertyCount("green", properties)).toEqual(3);
    expect(getGroupPropertyCount("dark_blue", properties)).toEqual(2);
  });
});

describe("createProperty", () => {
  it("successfully creates a property object shape", () => {
    expect(
      createProperty({
        name: "Mediterranean Avenue",
        spaceId: 1,
        groupId: PropertyGroups.BROWN,
        groupOrder: 0,
        cost: 60,
        rentValues: [2, 10, 30, 90, 160, 250],
        buildingCost: 50,
        mortgageValue: 30,
      })
    ).toEqual({
      name: "Mediterranean Avenue",
      spaceId: 1,
      groupId: "brown",
      groupOrder: 0,
      cost: 60,
      rentValues: [2, 10, 30, 90, 160, 250],
      buildingCost: 50,
      mortgageValue: 30,
      slug: "mediterranean_avenue",
      type: "property",
    });
  });
});

describe("buyProperty", () => {
  it("throws an error", () => {
    let user = createUser("James");

    user = spendMoney(user, 1500);

    const property = properties[0];

    expect(() => buyProperty(user, property)).toThrowError();

    user = earnedMoney(user, 1500);
    user = buyProperty(user, property);

    expect(() => buyProperty(user, property)).toThrowError();
  });
});

describe("unmortgageProperty", () => {
  it("throws an error", () => {
    let user = createUser("James");
    const property = properties[0];

    expect(() => unmortgageProperty(user, property)).toThrowError();

    user = buyProperty(user, property);
    user = mortgageProperty(user, property);
    user = unmortgageProperty(user, property);

    expect(() => unmortgageProperty(user, property)).toThrowError();
  });
  it("successfully unmortgages property", () => {
    let user = createUser("James");
    const property = properties[0];

    user = buyProperty(user, property);
    user = mortgageProperty(user, property);
    expect(getUserPropertyByProperty(user, property)).toEqual({
      buildingCost: 50,
      cost: 60,
      groupId: "brown",
      groupOrder: 0,
      hotel: false,
      houses: 0,
      mortgageValue: 30,
      mortgaged: true,
      name: "Mediterranean Avenue",
      rentValues: [2, 10, 30, 90, 160, 250],
      slug: "mediterranean_avenue",
      spaceId: 1,
      type: "property",
    });

    user = unmortgageProperty(user, property);

    expect(getUserPropertyByProperty(user, property)).toEqual({
      buildingCost: 50,
      cost: 60,
      groupId: "brown",
      groupOrder: 0,
      hotel: false,
      houses: 0,
      mortgageValue: 30,
      mortgaged: false,
      name: "Mediterranean Avenue",
      rentValues: [2, 10, 30, 90, 160, 250],
      slug: "mediterranean_avenue",
      spaceId: 1,
      type: "property",
    });
  });
});

it("returns the correct number of properties", () => {
  expect(properties).toHaveLength(22);
});
