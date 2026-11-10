export type ColorGroup =
  | "brown"
  | "light_blue"
  | "pink"
  | "orange"
  | "red"
  | "yellow"
  | "green"
  | "dark_blue";

export interface PropertySpace {
  readonly kind: "property";
  readonly name: string;
  readonly short: string;
  readonly group: ColorGroup;
  readonly cost: number;
  /** rent with 0-4 houses, then hotel */
  readonly rent: readonly [number, number, number, number, number, number];
  readonly buildingCost: number;
  readonly mortgageValue: number;
}

export interface RailroadSpace {
  readonly kind: "railroad";
  readonly name: string;
  readonly short: string;
  readonly cost: number;
  readonly mortgageValue: number;
}

export interface UtilitySpace {
  readonly kind: "utility";
  readonly name: string;
  readonly short: string;
  readonly cost: number;
  readonly mortgageValue: number;
}

export interface OtherSpace {
  readonly kind:
    | "go"
    | "jail"
    | "free_parking"
    | "go_to_jail"
    | "chance"
    | "community_chest"
    | "tax";
  readonly name: string;
  readonly short: string;
  readonly amount?: number;
}

export type OwnableSpace = PropertySpace | RailroadSpace | UtilitySpace;
export type Space = OwnableSpace | OtherSpace;

export interface Deed {
  owner: number | null;
  /** 0-4 houses, 5 = hotel */
  houses: number;
  mortgaged: boolean;
}

export interface Debt {
  /** player id, or null for the bank */
  creditor: number | null;
  amount: number;
  reason: string;
}

export interface Player {
  id: number;
  name: string;
  bot: boolean;
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  jailCards: { chance: boolean; community_chest: boolean };
  bankrupt: boolean;
  debts: Debt[];
}

export type DeckName = "chance" | "community_chest";

export interface TradeSide {
  spaces: number[];
  cash: number;
  jailCards: number;
}

export interface TradeOffer {
  from: number;
  to: number;
  give: TradeSide;
  get: TradeSide;
}

export type Phase =
  | { kind: "preRoll" }
  | { kind: "buyDecision"; space: number; canRollAgain: boolean }
  | {
      kind: "auction";
      space: number;
      highBid: number;
      highBidder: number | null;
      /** players still in, in bidding order */
      bidders: number[];
      turn: number;
      canRollAgain: boolean;
    }
  | { kind: "postRoll"; canRollAgain: boolean }
  | { kind: "gameOver"; winner: number };

export interface LogEntry {
  text: string;
  player?: number;
}

export interface GameState {
  players: Player[];
  deeds: Record<number, Deed>;
  current: number;
  phase: Phase;
  dice: [number, number] | null;
  doublesCount: number;
  decks: Record<DeckName, string[]>;
  housesLeft: number;
  hotelsLeft: number;
  pendingTrade: TradeOffer | null;
  /** `${from}:${space}` -> turn number of the last bot trade proposal */
  botTradeMemory: Record<string, number>;
  turn: number;
  rng: number;
  log: LogEntry[];
  /** the last card drawn, for display */
  lastCard: { deck: DeckName; text: string } | null;
}

export type Action =
  | { type: "roll" }
  | { type: "payJailFine" }
  | { type: "useJailCard" }
  | { type: "buy" }
  | { type: "declineBuy" }
  | { type: "bid"; amount: number }
  | { type: "passBid" }
  | { type: "endTurn" }
  | { type: "build"; space: number }
  | { type: "sellBuilding"; space: number }
  | { type: "mortgage"; space: number }
  | { type: "unmortgage"; space: number }
  | { type: "payDebts" }
  | { type: "declareBankruptcy" }
  | { type: "proposeTrade"; offer: TradeOffer }
  | { type: "acceptTrade" }
  | { type: "rejectTrade" };

/** Actions carry the id of the player performing them. */
export type PlayerAction = Action & { player: number };

export interface PlayerSetup {
  name: string;
  bot: boolean;
}
