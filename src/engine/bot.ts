import {
  BOARD,
  OWNABLE_INDICES,
  RAILROAD_INDICES,
  UTILITY_INDICES,
  groupIndices,
  ownable,
} from "./board";
import {
  buildError,
  jailCardCount,
  mortgageError,
  ownedBy,
  ownsFullGroup,
  rentFor,
  sellBuildingError,
  totalDebt,
  unmortgageCost,
  unmortgageError,
} from "./rules";
import type { Action, ColorGroup, GameState, TradeOffer } from "./types";

const GROUPS: ColorGroup[] = [
  "brown",
  "light_blue",
  "pink",
  "orange",
  "red",
  "yellow",
  "green",
  "dark_blue",
];

const TRADE_COOLDOWN_TURNS = 8;

/** Cash a bot tries to keep on hand to survive the rent on the board. */
export function reserve(state: GameState, id: number): number {
  let worst = 0;
  for (const i of OWNABLE_INDICES) {
    const owner = state.deeds[i].owner;
    if (owner === null || owner === id) continue;
    worst = Math.max(worst, rentFor(state, i, 7));
  }
  return Math.min(600, 100 + Math.round(worst * 0.5));
}

function round10(n: number): number {
  return Math.ceil(n / 10) * 10;
}

/** What `id` thinks a space is worth to them, given current ownership. */
function spaceValue(state: GameState, id: number, index: number): number {
  const s = ownable(index);
  let value = s.cost;
  if (s.kind === "property") {
    const others = groupIndices(s.group).filter((i) => i !== index);
    const mine = others.filter((i) => state.deeds[i].owner === id).length;
    const theirs = others.filter((i) => {
      const o = state.deeds[i].owner;
      return o !== null && o !== id;
    });
    if (mine === others.length) value *= 2;
    else if (mine > 0) value *= 1.25;
    // blocking an opponent's set
    if (theirs.length === others.length && new Set(theirs.map((i) => state.deeds[i].owner)).size === 1)
      value *= 1.4;
  } else {
    const set = s.kind === "railroad" ? RAILROAD_INDICES : UTILITY_INDICES;
    const mine = set.filter((i) => i !== index && state.deeds[i].owner === id).length;
    value *= 1 + mine * 0.2;
  }
  return value;
}

function setBonus(state: GameState, id: number): number {
  let bonus = 0;
  for (const g of GROUPS) {
    if (ownsFullGroup(state, id, g))
      bonus += groupIndices(g).reduce((sum, i) => sum + ownable(i).cost, 0);
  }
  const rr = RAILROAD_INDICES.filter((i) => state.deeds[i].owner === id).length;
  bonus += [0, 0, 50, 150, 300][rr];
  if (UTILITY_INDICES.every((i) => state.deeds[i].owner === id)) bonus += 50;
  return bonus;
}

function score(state: GameState, id: number): number {
  const p = state.players[id];
  const holdings = ownedBy(state, id).reduce((sum, i) => {
    const s = ownable(i);
    return sum + (state.deeds[i].mortgaged ? s.cost - unmortgageCost(i) : s.cost);
  }, 0);
  return p.money + holdings + jailCardCount(p) * 50 + setBonus(state, id);
}

function afterTrade(state: GameState, offer: TradeOffer): GameState {
  const next: GameState = {
    ...state,
    deeds: { ...state.deeds },
    players: state.players.map((p) => ({ ...p, jailCards: { ...p.jailCards } })),
  };
  const from = next.players[offer.from];
  const to = next.players[offer.to];
  from.money += offer.get.cash - offer.give.cash;
  to.money += offer.give.cash - offer.get.cash;
  for (const i of offer.give.spaces) next.deeds[i] = { ...next.deeds[i], owner: to.id };
  for (const i of offer.get.spaces) next.deeds[i] = { ...next.deeds[i], owner: from.id };
  return next;
}

/** How much better off the recipient thinks the trade leaves them (> 0 = accept). */
export function tradeMargin(state: GameState, offer: TradeOffer): number {
  const after = afterTrade(state, offer);
  const gain = score(after, offer.to) - score(state, offer.to);
  const threat = setBonus(after, offer.from) - setBonus(state, offer.from);
  const jailDelta = (offer.give.jailCards - offer.get.jailCards) * 50;
  return gain + jailDelta - 0.6 * threat - 10;
}

function improvementAction(state: GameState, id: number): Action | null {
  const p = state.players[id];
  const keep = reserve(state, id);

  // Lift mortgages on properties that complete a set first, then any others.
  const mortgaged = ownedBy(state, id)
    .filter((i) => state.deeds[i].mortgaged)
    .sort((a, b) => spaceValue(state, id, b) - spaceValue(state, id, a));
  for (const i of mortgaged) {
    if (!unmortgageError(state, id, i) && p.money - unmortgageCost(i) >= keep * 1.5)
      return { type: "unmortgage", space: i };
  }

  const buildable = ownedBy(state, id)
    .filter((i) => !buildError(state, id, i))
    .sort((a, b) => state.deeds[a].houses - state.deeds[b].houses || b - a);
  for (const i of buildable) {
    const s = BOARD[i];
    if (s.kind === "property" && p.money - s.buildingCost >= keep)
      return { type: "build", space: i };
  }
  return null;
}

function raiseFundsAction(state: GameState, id: number): Action {
  const owned = ownedBy(state, id);
  const bySpareValue = [...owned].sort(
    (a, b) => spaceValue(state, id, a) - spaceValue(state, id, b)
  );

  // Mortgage properties outside complete sets first.
  for (const i of bySpareValue) {
    const s = ownable(i);
    const inSet = s.kind === "property" && ownsFullGroup(state, id, s.group);
    if (!inSet && !mortgageError(state, id, i)) return { type: "mortgage", space: i };
  }
  // Then sell buildings, starting with the most developed.
  const withBuildings = owned
    .filter((i) => !sellBuildingError(state, id, i))
    .sort((a, b) => state.deeds[b].houses - state.deeds[a].houses);
  if (withBuildings.length > 0) return { type: "sellBuilding", space: withBuildings[0] };
  for (const i of bySpareValue) {
    if (!mortgageError(state, id, i)) return { type: "mortgage", space: i };
  }
  return { type: "declareBankruptcy" };
}

function auctionAction(state: GameState, id: number): Action {
  const phase = state.phase;
  if (phase.kind !== "auction") return { type: "passBid" };
  const p = state.players[id];
  const s = ownable(phase.space);
  const value = spaceValue(state, id, phase.space);
  const completes = value >= s.cost * 2;
  const limit = completes ? p.money : p.money - reserve(state, id) / 2;
  const maxBid = Math.floor(Math.min(value, limit));
  const next = Math.min(
    maxBid,
    phase.highBid + Math.max(10, round10((maxBid - phase.highBid) / 2))
  );
  return next > phase.highBid ? { type: "bid", amount: next } : { type: "passBid" };
}

function buyAction(state: GameState, id: number, index: number): Action {
  const p = state.players[id];
  const s = ownable(index);
  if (p.money < s.cost) return { type: "declineBuy" };
  const wanted = spaceValue(state, id, index) > s.cost;
  if (wanted || p.money - s.cost >= reserve(state, id)) return { type: "buy" };
  return { type: "declineBuy" };
}

/** Looks for a trade that would complete one of the bot's color sets. */
export function proposeTradeAction(state: GameState, id: number): Action | null {
  const p = state.players[id];
  for (const group of GROUPS) {
    const indices = groupIndices(group);
    if (indices.some((i) => state.deeds[i].houses > 0)) continue;
    const missing = indices.filter((i) => state.deeds[i].owner !== id);
    if (missing.length !== 1 || missing.length === indices.length) continue;
    const want = missing[0];
    const owner = state.deeds[want].owner;
    if (owner === null || state.players[owner].bankrupt) continue;
    const last = state.botTradeMemory[`${id}:${want}`];
    if (last !== undefined && state.turn - last < TRADE_COOLDOWN_TURNS) continue;

    // Sweeten with a property that completes one of their sets, if we have one.
    const sweetener = ownedBy(state, id).find((i) => {
      const s = ownable(i);
      if (s.kind !== "property" || s.group === group) return false;
      const rest = groupIndices(s.group).filter((j) => j !== i);
      return (
        rest.every((j) => state.deeds[j].owner === owner) &&
        groupIndices(s.group).every((j) => state.deeds[j].houses === 0)
      );
    });

    const offer: TradeOffer = {
      from: id,
      to: owner,
      give: { spaces: sweetener === undefined ? [] : [sweetener], cash: 0, jailCards: 0 },
      get: { spaces: [want], cash: 0, jailCards: 0 },
    };
    const deficit = -tradeMargin(state, offer);
    if (deficit > 0) offer.give.cash = round10(deficit + 1);
    if (offer.give.cash > p.money - 100) continue;

    // Only worth it if we still come out ahead.
    const mine = score(afterTrade(state, offer), id) - score(state, id);
    if (mine <= 0) continue;
    return { type: "proposeTrade", offer };
  }
  return null;
}

/** Picks the next action for a bot that `activeActor` says must move. */
export function botAction(state: GameState, id: number): Action {
  const p = state.players[id];
  const phase = state.phase;

  if (state.pendingTrade && state.pendingTrade.to === id) {
    return tradeMargin(state, state.pendingTrade) > 0
      ? { type: "acceptTrade" }
      : { type: "rejectTrade" };
  }

  if (p.debts.length > 0) {
    return p.money >= totalDebt(p) ? { type: "payDebts" } : raiseFundsAction(state, id);
  }

  switch (phase.kind) {
    case "auction":
      return auctionAction(state, id);
    case "buyDecision":
      return buyAction(state, id, phase.space);
    case "preRoll": {
      const improve = improvementAction(state, id);
      if (improve) return improve;
      const trade = proposeTradeAction(state, id);
      if (trade) return trade;
      if (p.inJail) {
        const unowned = OWNABLE_INDICES.filter((i) => state.deeds[i].owner === null).length;
        if (unowned > 6) {
          if (jailCardCount(p) > 0) return { type: "useJailCard" };
          if (p.money - 50 >= reserve(state, id)) return { type: "payJailFine" };
        }
      }
      return { type: "roll" };
    }
    case "postRoll": {
      const improve = improvementAction(state, id);
      if (improve) return improve;
      return phase.canRollAgain ? { type: "roll" } : { type: "endTurn" };
    }
    case "gameOver":
      return { type: "endTurn" };
  }
}
