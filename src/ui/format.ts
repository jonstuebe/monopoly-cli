import type { TradeOffer, TradeSide } from "../engine/types";
import { BOARD } from "../engine/board";
import type { GameState } from "../engine/types";

export function fit(text: string, width: number): string {
  if (width <= 0) return "";
  return text.length > width ? text.slice(0, width) : text.padEnd(width);
}

export function center(text: string, width: number): string {
  const t = text.length > width ? text.slice(0, width) : text;
  const left = Math.floor((width - t.length) / 2);
  return " ".repeat(left) + t + " ".repeat(width - t.length - left);
}

export function money(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}


function describeSide(side: TradeSide): string {
  const parts = side.spaces.map((i) => BOARD[i].name);
  if (side.cash > 0) parts.push(money(side.cash));
  if (side.jailCards > 0)
    parts.push(`${side.jailCards} Get Out of Jail Free card${side.jailCards > 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(", ") : "nothing";
}

export function describeTrade(state: GameState, offer: TradeOffer): string[] {
  const from = state.players[offer.from].name;
  const to = state.players[offer.to].name;
  return [
    `${from} gives ${to}: ${describeSide(offer.give)}`,
    `${from} wants from ${to}: ${describeSide(offer.get)}`,
  ];
}
