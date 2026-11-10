import {
  BOARD,
  OWNABLE_INDICES,
  RAILROAD_INDICES,
  UTILITY_INDICES,
  groupIndices,
  ownable,
  setIndices,
} from "./board";
import type { ColorGroup, GameState, Player, TradeOffer, TradeSide } from "./types";

export function ownerOf(state: GameState, index: number): number | null {
  return state.deeds[index]?.owner ?? null;
}

export function ownedBy(state: GameState, player: number): number[] {
  return OWNABLE_INDICES.filter((i) => state.deeds[i].owner === player);
}

export function ownsFullGroup(
  state: GameState,
  player: number,
  group: ColorGroup
): boolean {
  return groupIndices(group).every((i) => state.deeds[i].owner === player);
}

export function activePlayers(state: GameState): Player[] {
  return state.players.filter((p) => !p.bankrupt);
}

export function totalDebt(player: Player): number {
  return player.debts.reduce((sum, d) => sum + d.amount, 0);
}

/**
 * The player whose input the game is waiting on. Trade responses and
 * outstanding debts interrupt the normal turn order.
 */
export function activeActor(state: GameState): number {
  if (state.phase.kind === "gameOver") return state.phase.winner;
  if (state.pendingTrade) return state.pendingTrade.to;
  const n = state.players.length;
  for (let k = 0; k < n; k++) {
    const p = state.players[(state.current + k) % n];
    if (!p.bankrupt && p.debts.length > 0) return p.id;
  }
  if (state.phase.kind === "auction") {
    return state.phase.bidders[state.phase.turn];
  }
  return state.current;
}

/**
 * Rent owed for landing on `index`. `diceTotal` is used for utilities;
 * `cardMultiplier` covers the Chance cards that double railroad rent or force
 * 10x utility rent.
 */
export function rentFor(
  state: GameState,
  index: number,
  diceTotal: number,
  cardMultiplier = false
): number {
  const deed = state.deeds[index];
  if (deed.owner === null || deed.mortgaged) return 0;
  const s = ownable(index);
  const owner = deed.owner;

  switch (s.kind) {
    case "property": {
      if (deed.houses > 0) return s.rent[deed.houses];
      return ownsFullGroup(state, owner, s.group) ? s.rent[0] * 2 : s.rent[0];
    }
    case "railroad": {
      const count = RAILROAD_INDICES.filter(
        (i) => state.deeds[i].owner === owner
      ).length;
      const rent = 25 * 2 ** (count - 1);
      return cardMultiplier ? rent * 2 : rent;
    }
    case "utility": {
      const count = UTILITY_INDICES.filter(
        (i) => state.deeds[i].owner === owner
      ).length;
      const factor = cardMultiplier || count === 2 ? 10 : 4;
      return diceTotal * factor;
    }
  }
}

export function unmortgageCost(index: number): number {
  return Math.round(ownable(index).mortgageValue * 1.1);
}

/** Returns a reason the player can't build on `index`, or null if they can. */
export function buildError(
  state: GameState,
  player: number,
  index: number
): string | null {
  const s = BOARD[index];
  if (s.kind !== "property") return "You can only build on color properties.";
  const deed = state.deeds[index];
  if (deed.owner !== player) return "You don't own this property.";
  if (!ownsFullGroup(state, player, s.group))
    return "You need to own every property in the color group first.";
  const group = groupIndices(s.group);
  if (group.some((i) => state.deeds[i].mortgaged))
    return "Unmortgage every property in the group before building.";
  if (deed.houses === 5) return "This property already has a hotel.";
  const min = Math.min(...group.map((i) => state.deeds[i].houses));
  if (deed.houses > min) return "Houses must be built evenly across the group.";
  if (deed.houses === 4) {
    if (state.hotelsLeft === 0) return "The bank has no hotels left.";
  } else if (state.housesLeft === 0) {
    return "The bank has no houses left.";
  }
  if (state.players[player].money < s.buildingCost)
    return `You need $${s.buildingCost} to build here.`;
  return null;
}

export function sellBuildingError(
  state: GameState,
  player: number,
  index: number
): string | null {
  const s = BOARD[index];
  if (s.kind !== "property") return "There are no buildings here.";
  const deed = state.deeds[index];
  if (deed.owner !== player) return "You don't own this property.";
  if (deed.houses === 0) return "There are no buildings here.";
  const max = Math.max(...groupIndices(s.group).map((i) => state.deeds[i].houses));
  if (deed.houses < max) return "Houses must be sold evenly across the group.";
  if (deed.houses === 5 && state.housesLeft < 4)
    return "The bank doesn't have 4 houses to replace this hotel.";
  return null;
}

export function mortgageError(
  state: GameState,
  player: number,
  index: number
): string | null {
  const deed = state.deeds[index];
  if (!deed || deed.owner !== player) return "You don't own this property.";
  if (deed.mortgaged) return "This property is already mortgaged.";
  const s = ownable(index);
  if (s.kind === "property" && groupIndices(s.group).some((i) => state.deeds[i].houses > 0))
    return "Sell all buildings in this color group first.";
  return null;
}

export function unmortgageError(
  state: GameState,
  player: number,
  index: number
): string | null {
  const deed = state.deeds[index];
  if (!deed || deed.owner !== player) return "You don't own this property.";
  if (!deed.mortgaged) return "This property isn't mortgaged.";
  if (state.players[player].money < unmortgageCost(index))
    return `You need $${unmortgageCost(index)} to lift this mortgage.`;
  return null;
}

/** Cash a player could raise right now by selling buildings and mortgaging. */
export function liquidationValue(state: GameState, player: number): number {
  return ownedBy(state, player).reduce((sum, i) => {
    const s = ownable(i);
    const deed = state.deeds[i];
    const buildings =
      s.kind === "property" ? (deed.houses * s.buildingCost) / 2 : 0;
    return sum + buildings + (deed.mortgaged ? 0 : s.mortgageValue);
  }, state.players[player].money);
}

export function netWorth(state: GameState, player: number): number {
  return ownedBy(state, player).reduce((sum, i) => {
    const s = ownable(i);
    const deed = state.deeds[i];
    const buildings = s.kind === "property" ? deed.houses * s.buildingCost : 0;
    return sum + buildings + (deed.mortgaged ? s.mortgageValue : s.cost);
  }, state.players[player].money);
}

export function jailCardCount(player: Player): number {
  return Number(player.jailCards.chance) + Number(player.jailCards.community_chest);
}

function sideError(
  state: GameState,
  owner: Player,
  side: TradeSide
): string | null {
  if (side.cash < 0) return "Cash amounts can't be negative.";
  if (side.cash > owner.money) return `${owner.name} doesn't have $${side.cash}.`;
  if (side.jailCards > jailCardCount(owner))
    return `${owner.name} doesn't have that many Get Out of Jail Free cards.`;
  for (const i of side.spaces) {
    if (state.deeds[i]?.owner !== owner.id)
      return `${owner.name} doesn't own ${BOARD[i].name}.`;
    if (setIndices(i).some((j) => state.deeds[j].houses > 0))
      return `Sell the buildings in ${BOARD[i].name}'s group before trading it.`;
  }
  return null;
}

export function tradeError(state: GameState, offer: TradeOffer): string | null {
  if (offer.from === offer.to) return "You can't trade with yourself.";
  const from = state.players[offer.from];
  const to = state.players[offer.to];
  if (!from || !to || from.bankrupt || to.bankrupt)
    return "Both players must still be in the game.";
  const empty = (s: TradeSide) =>
    s.spaces.length === 0 && s.cash === 0 && s.jailCards === 0;
  if (empty(offer.give) && empty(offer.get)) return "The trade is empty.";
  return sideError(state, from, offer.give) ?? sideError(state, to, offer.get);
}

export function playerColorIndex(player: number): number {
  return player % 6;
}
