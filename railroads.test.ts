import { getRailroadBySlug, createRailroad, buyRailroad } from "./railroads";

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
