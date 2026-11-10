import type { DeckName } from "./types";

export type CardEffect =
  | { kind: "advance"; to: number }
  | { kind: "advanceNearest"; target: "railroad" | "utility" }
  | { kind: "back"; spaces: number }
  | { kind: "collect"; amount: number }
  | { kind: "pay"; amount: number }
  | { kind: "payEachPlayer"; amount: number }
  | { kind: "collectFromEachPlayer"; amount: number }
  | { kind: "repairs"; perHouse: number; perHotel: number }
  | { kind: "goToJail" }
  | { kind: "jailCard" };

export interface Card {
  id: string;
  deck: DeckName;
  text: string;
  effect: CardEffect;
}

const CHANCE: Card[] = (
  [
  { id: "c-boardwalk", text: "Advance to Boardwalk.", effect: { kind: "advance", to: 39 } },
  { id: "c-go", text: "Advance to GO. Collect $200.", effect: { kind: "advance", to: 0 } },
  { id: "c-illinois", text: "Advance to Illinois Avenue. If you pass GO, collect $200.", effect: { kind: "advance", to: 24 } },
  { id: "c-stcharles", text: "Advance to St. Charles Place. If you pass GO, collect $200.", effect: { kind: "advance", to: 11 } },
  { id: "c-rr1", text: "Advance to the nearest Railroad. If owned, pay the owner twice the rent.", effect: { kind: "advanceNearest", target: "railroad" } },
  { id: "c-rr2", text: "Advance to the nearest Railroad. If owned, pay the owner twice the rent.", effect: { kind: "advanceNearest", target: "railroad" } },
  { id: "c-utility", text: "Advance to the nearest Utility. If owned, roll the dice and pay the owner 10x the roll.", effect: { kind: "advanceNearest", target: "utility" } },
  { id: "c-dividend", text: "Bank pays you a dividend of $50.", effect: { kind: "collect", amount: 50 } },
  { id: "c-jail-free", text: "Get Out of Jail Free. Keep this card until needed.", effect: { kind: "jailCard" } },
  { id: "c-back3", text: "Go back 3 spaces.", effect: { kind: "back", spaces: 3 } },
  { id: "c-jail", text: "Go directly to Jail. Do not pass GO, do not collect $200.", effect: { kind: "goToJail" } },
  { id: "c-repairs", text: "Make general repairs: pay $25 per house and $100 per hotel.", effect: { kind: "repairs", perHouse: 25, perHotel: 100 } },
  { id: "c-speeding", text: "Speeding fine: pay $15.", effect: { kind: "pay", amount: 15 } },
  { id: "c-reading", text: "Take a trip to Reading Railroad. If you pass GO, collect $200.", effect: { kind: "advance", to: 5 } },
  { id: "c-chairman", text: "You have been elected Chairman of the Board. Pay each player $50.", effect: { kind: "payEachPlayer", amount: 50 } },
  { id: "c-loan", text: "Your building loan matures. Collect $150.", effect: { kind: "collect", amount: 150 } },
  ] satisfies Omit<Card, "deck">[]
).map((c) => ({ ...c, deck: "chance" as const }));

const COMMUNITY_CHEST: Card[] = (
  [
  { id: "cc-go", text: "Advance to GO. Collect $200.", effect: { kind: "advance", to: 0 } },
  { id: "cc-bank-error", text: "Bank error in your favor. Collect $200.", effect: { kind: "collect", amount: 200 } },
  { id: "cc-doctor", text: "Doctor's fee. Pay $50.", effect: { kind: "pay", amount: 50 } },
  { id: "cc-stock", text: "From sale of stock you get $50.", effect: { kind: "collect", amount: 50 } },
  { id: "cc-jail-free", text: "Get Out of Jail Free. Keep this card until needed.", effect: { kind: "jailCard" } },
  { id: "cc-jail", text: "Go directly to Jail. Do not pass GO, do not collect $200.", effect: { kind: "goToJail" } },
  { id: "cc-holiday", text: "Holiday fund matures. Receive $100.", effect: { kind: "collect", amount: 100 } },
  { id: "cc-tax-refund", text: "Income tax refund. Collect $20.", effect: { kind: "collect", amount: 20 } },
  { id: "cc-birthday", text: "It is your birthday. Collect $10 from every player.", effect: { kind: "collectFromEachPlayer", amount: 10 } },
  { id: "cc-life", text: "Life insurance matures. Collect $100.", effect: { kind: "collect", amount: 100 } },
  { id: "cc-hospital", text: "Pay hospital fees of $100.", effect: { kind: "pay", amount: 100 } },
  { id: "cc-school", text: "Pay school fees of $50.", effect: { kind: "pay", amount: 50 } },
  { id: "cc-consultancy", text: "Receive $25 consultancy fee.", effect: { kind: "collect", amount: 25 } },
  { id: "cc-repairs", text: "You are assessed for street repairs: $40 per house, $115 per hotel.", effect: { kind: "repairs", perHouse: 40, perHotel: 115 } },
  { id: "cc-beauty", text: "You have won second prize in a beauty contest. Collect $10.", effect: { kind: "collect", amount: 10 } },
  { id: "cc-inherit", text: "You inherit $100.", effect: { kind: "collect", amount: 100 } },
  ] satisfies Omit<Card, "deck">[]
).map((c) => ({ ...c, deck: "community_chest" as const }));

export const CARDS: Record<string, Card> = Object.fromEntries(
  [...CHANCE, ...COMMUNITY_CHEST].map((c) => [c.id, c])
);

export const DECK_CARD_IDS: Record<DeckName, string[]> = {
  chance: CHANCE.map((c) => c.id),
  community_chest: COMMUNITY_CHEST.map((c) => c.id),
};

export const JAIL_CARD_IDS: Record<DeckName, string> = {
  chance: "c-jail-free",
  community_chest: "cc-jail-free",
};

export const DECK_LABELS: Record<DeckName, string> = {
  chance: "Chance",
  community_chest: "Community Chest",
};
