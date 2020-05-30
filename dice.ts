import { addArray } from "./utils";

export type DiceRoll = [number, number];

export function rollDie(): number {
  return Math.ceil(Math.random() * 6);
}

export function rollDice(): DiceRoll {
  return [rollDie(), rollDie()];
}

export class DiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiceError";
  }
}

export function isValidDiceRoll(dice: DiceRoll): boolean {
  return dice.every((d) => d > 0 && d <= 6);
}

export function isDouble(dice: DiceRoll): boolean {
  if (!isValidDiceRoll(dice)) {
    throw new DiceError("Invalid Dice Roll");
  }

  return dice[0] === dice[1];
}

export function diceTotal(dice: DiceRoll): number {
  if (!isValidDiceRoll(dice)) {
    throw new DiceError("Invalid Dice Roll");
  }

  return addArray(dice);
}
