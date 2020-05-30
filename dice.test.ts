import { rollDice, rollDie, isDouble, diceTotal } from "./dice";

describe("rollDice", () => {
  it("returns an number tuple between 1-6 each", () => {
    const [diceOne, diceTwo] = rollDice();

    expect(diceOne).toBeLessThanOrEqual(6);
    expect(diceOne).toBeGreaterThan(0);

    expect(diceTwo).toBeLessThanOrEqual(6);
    expect(diceTwo).toBeGreaterThan(0);
  });
});

describe("rollDie", () => {
  it("returns a number between 1-6", () => {
    const die = rollDie();
    expect(die).toBeLessThanOrEqual(6);
    expect(die).toBeGreaterThan(0);
  });
});

describe("isDouble", () => {
  it("returns true", () => {
    expect(isDouble([2, 2])).toBeTruthy();
  });
  it("returns false", () => {
    expect(isDouble([2, 1])).toBeFalsy();
  });
  it("throws an error", () => {
    expect(() => isDouble([5, 7])).toThrowError();
  });
});

describe("diceTotal", () => {
  it("returns the total of the dice", () => {
    expect(diceTotal([4, 6])).toEqual(10);
    expect(diceTotal([1, 2])).toEqual(3);
  });
  it("throw and error", () => {
    expect(() => diceTotal([5, 7])).toThrowError();
  });
});
