import { addArray } from "./utils";

export type DiceRoll = [number, number];

export function rollDie(): number {
  return Math.ceil(Math.random() * 6);
}

export function rollDice(): DiceRoll {
  return [rollDie(), rollDie()];
}

export function isDouble(dice: DiceRoll): boolean {
  return dice[0] === dice[1];
}

export function diceTotal(dice: DiceRoll): number {
  return addArray(dice);
}
