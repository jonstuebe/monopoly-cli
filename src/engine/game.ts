import {
  BOARD,
  GO_SALARY,
  JAIL,
  JAIL_FINE,
  OWNABLE_INDICES,
  RAILROAD_INDICES,
  STARTING_MONEY,
  TOTAL_HOTELS,
  TOTAL_HOUSES,
  UTILITY_INDICES,
  isOwnable,
  ownable,
} from "./board";
import { CARDS, DECK_CARD_IDS, DECK_LABELS, JAIL_CARD_IDS } from "./cards";
import { nextRandom, randomSeed } from "./rng";
import {
  activeActor,
  activePlayers,
  buildError,
  mortgageError,
  ownedBy,
  rentFor,
  sellBuildingError,
  totalDebt,
  tradeError,
  unmortgageCost,
  unmortgageError,
} from "./rules";
import type {
  DeckName,
  GameState,
  Player,
  PlayerAction,
  PlayerSetup,
  TradeSide,
} from "./types";

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameError";
  }
}

const MAX_LOG = 200;

export function createGame(setup: PlayerSetup[], seed = randomSeed()): GameState {
  if (setup.length < 2 || setup.length > 6)
    throw new GameError("Monopoly needs 2 to 6 players.");

  const players: Player[] = setup.map((s, id) => ({
    id,
    name: s.name,
    bot: s.bot,
    money: STARTING_MONEY,
    position: 0,
    inJail: false,
    jailTurns: 0,
    jailCards: { chance: false, community_chest: false },
    bankrupt: false,
    debts: [],
  }));

  const g: GameState = {
    players,
    deeds: Object.fromEntries(
      OWNABLE_INDICES.map((i) => [i, { owner: null, houses: 0, mortgaged: false }])
    ),
    current: 0,
    phase: { kind: "preRoll" },
    dice: null,
    doublesCount: 0,
    decks: {
      chance: [...DECK_CARD_IDS.chance],
      community_chest: [...DECK_CARD_IDS.community_chest],
    },
    housesLeft: TOTAL_HOUSES,
    hotelsLeft: TOTAL_HOTELS,
    pendingTrade: null,
    botTradeMemory: {},
    turn: 1,
    rng: seed,
    log: [],
    lastCard: null,
  };

  shuffle(g, g.decks.chance);
  shuffle(g, g.decks.community_chest);
  log(g, `Game started with ${players.map((p) => p.name).join(", ")}.`);
  log(g, `It's ${players[0].name}'s turn.`, 0);
  return g;
}

/** Applies an action to a copy of the state. Throws GameError if it isn't allowed. */
export function applyAction(state: GameState, action: PlayerAction): GameState {
  const g = structuredClone(state);
  perform(g, action);
  if (g.log.length > MAX_LOG) g.log.splice(0, g.log.length - MAX_LOG);
  return g;
}

function perform(g: GameState, action: PlayerAction): void {
  if (g.phase.kind === "gameOver") throw new GameError("The game is over.");
  const p = g.players[action.player];
  if (!p || p.bankrupt) throw new GameError("That player isn't in the game.");
  if (action.player !== activeActor(g))
    throw new GameError(`It's not ${p.name}'s move.`);

  const phase = g.phase;
  const inDebt = p.debts.length > 0;
  const blocked = (what: string) => {
    if (inDebt) throw new GameError(`Pay your debts before you ${what}.`);
    if (g.pendingTrade) throw new GameError("Answer the trade offer first.");
  };

  switch (action.type) {
    case "roll": {
      blocked("roll");
      const canRoll =
        phase.kind === "preRoll" ||
        (phase.kind === "postRoll" && phase.canRollAgain);
      if (!canRoll || action.player !== g.current)
        throw new GameError("You can't roll right now.");
      roll(g, p);
      return;
    }

    case "payJailFine": {
      blocked("leave jail");
      if (phase.kind !== "preRoll" || !p.inJail)
        throw new GameError("You aren't in jail.");
      if (p.money < JAIL_FINE)
        throw new GameError(`You need $${JAIL_FINE} to pay the fine.`);
      p.money -= JAIL_FINE;
      leaveJail(p);
      log(g, `${p.name} paid $${JAIL_FINE} to get out of jail.`, p.id);
      return;
    }

    case "useJailCard": {
      blocked("leave jail");
      if (phase.kind !== "preRoll" || !p.inJail)
        throw new GameError("You aren't in jail.");
      const deck: DeckName | null = p.jailCards.chance
        ? "chance"
        : p.jailCards.community_chest
          ? "community_chest"
          : null;
      if (!deck) throw new GameError("You don't have a Get Out of Jail Free card.");
      p.jailCards[deck] = false;
      g.decks[deck].push(JAIL_CARD_IDS[deck]);
      leaveJail(p);
      log(g, `${p.name} used a Get Out of Jail Free card.`, p.id);
      return;
    }

    case "buy": {
      blocked("buy");
      if (phase.kind !== "buyDecision") throw new GameError("There's nothing to buy.");
      const s = ownable(phase.space);
      if (p.money < s.cost)
        throw new GameError(`You need $${s.cost} to buy ${s.name}.`);
      p.money -= s.cost;
      g.deeds[phase.space].owner = p.id;
      log(g, `${p.name} bought ${s.name} for $${s.cost}.`, p.id);
      g.phase = { kind: "postRoll", canRollAgain: phase.canRollAgain };
      return;
    }

    case "declineBuy": {
      blocked("continue");
      if (phase.kind !== "buyDecision") throw new GameError("There's nothing to buy.");
      const n = g.players.length;
      const bidders: number[] = [];
      for (let k = 0; k < n; k++) {
        const candidate = g.players[(g.current + k) % n];
        if (!candidate.bankrupt) bidders.push(candidate.id);
      }
      log(g, `${BOARD[phase.space].name} goes up for auction.`);
      g.phase = {
        kind: "auction",
        space: phase.space,
        highBid: 0,
        highBidder: null,
        bidders,
        turn: 0,
        canRollAgain: phase.canRollAgain,
      };
      return;
    }

    case "bid": {
      blocked("bid");
      if (phase.kind !== "auction") throw new GameError("There's no auction.");
      if (!Number.isInteger(action.amount) || action.amount <= phase.highBid)
        throw new GameError(`Bid more than $${phase.highBid}.`);
      if (action.amount > p.money)
        throw new GameError(`You only have $${p.money}.`);
      phase.highBid = action.amount;
      phase.highBidder = p.id;
      log(g, `${p.name} bids $${action.amount}.`, p.id);
      phase.turn = (phase.turn + 1) % phase.bidders.length;
      settleAuction(g);
      return;
    }

    case "passBid": {
      blocked("pass");
      if (phase.kind !== "auction") throw new GameError("There's no auction.");
      log(g, `${p.name} passes.`, p.id);
      phase.bidders.splice(phase.turn, 1);
      if (phase.turn >= phase.bidders.length) phase.turn = 0;
      settleAuction(g);
      return;
    }

    case "endTurn": {
      blocked("end your turn");
      if (phase.kind !== "postRoll" || phase.canRollAgain)
        throw new GameError("You can't end your turn yet.");
      nextTurn(g);
      return;
    }

    case "build": {
      assertCanManage(g);
      const err = buildError(g, p.id, action.space);
      if (err) throw new GameError(err);
      const s = BOARD[action.space];
      if (s.kind !== "property") return;
      const deed = g.deeds[action.space];
      deed.houses += 1;
      p.money -= s.buildingCost;
      if (deed.houses === 5) {
        g.hotelsLeft -= 1;
        g.housesLeft += 4;
        log(g, `${p.name} built a hotel on ${s.name}.`, p.id);
      } else {
        g.housesLeft -= 1;
        log(g, `${p.name} built a house on ${s.name}.`, p.id);
      }
      return;
    }

    case "sellBuilding": {
      assertCanManage(g);
      const err = sellBuildingError(g, p.id, action.space);
      if (err) throw new GameError(err);
      const s = BOARD[action.space];
      if (s.kind !== "property") return;
      const deed = g.deeds[action.space];
      const refund = s.buildingCost / 2;
      if (deed.houses === 5) {
        g.hotelsLeft += 1;
        g.housesLeft -= 4;
        log(g, `${p.name} sold a hotel on ${s.name} for $${refund}.`, p.id);
      } else {
        g.housesLeft += 1;
        log(g, `${p.name} sold a house on ${s.name} for $${refund}.`, p.id);
      }
      deed.houses -= 1;
      p.money += refund;
      return;
    }

    case "mortgage": {
      assertCanManage(g);
      const err = mortgageError(g, p.id, action.space);
      if (err) throw new GameError(err);
      const s = ownable(action.space);
      g.deeds[action.space].mortgaged = true;
      p.money += s.mortgageValue;
      log(g, `${p.name} mortgaged ${s.name} for $${s.mortgageValue}.`, p.id);
      return;
    }

    case "unmortgage": {
      assertCanManage(g);
      const err = unmortgageError(g, p.id, action.space);
      if (err) throw new GameError(err);
      const cost = unmortgageCost(action.space);
      g.deeds[action.space].mortgaged = false;
      p.money -= cost;
      log(g, `${p.name} lifted the mortgage on ${BOARD[action.space].name} for $${cost}.`, p.id);
      return;
    }

    case "payDebts": {
      if (!inDebt) throw new GameError("You don't owe anything.");
      const owed = totalDebt(p);
      if (p.money < owed)
        throw new GameError(`You need $${owed - p.money} more to pay your debts.`);
      for (const d of p.debts) transfer(g, p.id, d.amount, d.creditor, d.reason);
      p.debts = [];
      return;
    }

    case "declareBankruptcy": {
      if (!inDebt)
        throw new GameError("You can only declare bankruptcy when you owe money.");
      bankrupt(g, p);
      return;
    }

    case "proposeTrade": {
      blocked("trade");
      if (phase.kind === "auction") throw new GameError("Finish the auction first.");
      const { offer } = action;
      if (offer.from !== p.id) throw new GameError("You can only offer your own things.");
      const err = tradeError(g, offer);
      if (err) throw new GameError(err);
      g.pendingTrade = structuredClone(offer);
      for (const i of offer.get.spaces) g.botTradeMemory[`${p.id}:${i}`] = g.turn;
      log(g, `${p.name} offers ${g.players[offer.to].name} a trade.`, p.id);
      return;
    }

    case "acceptTrade":
    case "rejectTrade": {
      const offer = g.pendingTrade;
      if (!offer || offer.to !== p.id) throw new GameError("There's no trade to answer.");
      g.pendingTrade = null;
      const from = g.players[offer.from];
      if (action.type === "rejectTrade") {
        log(g, `${p.name} declined ${from.name}'s trade.`, p.id);
        return;
      }
      const err = tradeError(g, offer);
      if (err) throw new GameError(err);
      moveSide(g, from, p, offer.give);
      moveSide(g, p, from, offer.get);
      log(g, `${p.name} accepted ${from.name}'s trade.`, p.id);
      return;
    }
  }
}

function assertCanManage(g: GameState): void {
  if (g.pendingTrade) throw new GameError("Answer the trade offer first.");
}

function log(g: GameState, text: string, player?: number): void {
  g.log.push(player === undefined ? { text } : { text, player });
}

function random(g: GameState): number {
  const [value, seed] = nextRandom(g.rng);
  g.rng = seed;
  return value;
}

function shuffle<T>(g: GameState, arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random(g) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function rollDice(g: GameState): [number, number] {
  return [Math.floor(random(g) * 6) + 1, Math.floor(random(g) * 6) + 1];
}

function leaveJail(p: Player): void {
  p.inJail = false;
  p.jailTurns = 0;
}

function sendToJail(g: GameState, p: Player): void {
  p.position = JAIL;
  p.inJail = true;
  p.jailTurns = 0;
  g.doublesCount = 0;
  g.phase = { kind: "postRoll", canRollAgain: false };
  log(g, `${p.name} goes to jail!`, p.id);
}

function roll(g: GameState, p: Player): void {
  const dice = rollDice(g);
  const total = dice[0] + dice[1];
  const doubles = dice[0] === dice[1];
  g.dice = dice;
  log(g, `${p.name} rolled ${dice[0]} + ${dice[1]} = ${total}${doubles ? " (doubles!)" : ""}.`, p.id);

  if (p.inJail) {
    if (doubles) {
      leaveJail(p);
      log(g, `${p.name} rolled doubles and leaves jail.`, p.id);
    } else {
      p.jailTurns += 1;
      if (p.jailTurns < 3) {
        log(g, `${p.name} stays in jail.`, p.id);
        g.phase = { kind: "postRoll", canRollAgain: false };
        return;
      }
      leaveJail(p);
      charge(g, p, JAIL_FINE, null, "the jail fine");
    }
    moveBy(g, p, total);
    resolveLanding(g, p, false);
    return;
  }

  if (doubles) {
    g.doublesCount += 1;
    if (g.doublesCount === 3) {
      log(g, `${p.name} rolled doubles three times in a row.`, p.id);
      sendToJail(g, p);
      return;
    }
  }
  moveBy(g, p, total);
  resolveLanding(g, p, doubles);
}

function moveBy(g: GameState, p: Player, steps: number): void {
  const dest = (p.position + steps) % BOARD.length;
  if (p.position + steps >= BOARD.length) collectSalary(g, p);
  p.position = dest;
}

function advanceTo(g: GameState, p: Player, dest: number): void {
  if (dest <= p.position) collectSalary(g, p);
  p.position = dest;
}

function collectSalary(g: GameState, p: Player): void {
  p.money += GO_SALARY;
  log(g, `${p.name} passed GO and collected $${GO_SALARY}.`, p.id);
}

function resolveLanding(
  g: GameState,
  p: Player,
  canRollAgain: boolean,
  cardMultiplier = false
): void {
  g.phase = { kind: "postRoll", canRollAgain };
  const index = p.position;
  const s = BOARD[index];
  log(g, `${p.name} landed on ${s.name}.`, p.id);

  if (isOwnable(s)) {
    const deed = g.deeds[index];
    if (deed.owner === null) {
      g.phase = { kind: "buyDecision", space: index, canRollAgain };
      return;
    }
    if (deed.owner === p.id) return;
    if (deed.mortgaged) {
      log(g, `${s.name} is mortgaged, so no rent is due.`);
      return;
    }
    let diceTotal = g.dice ? g.dice[0] + g.dice[1] : 0;
    if (s.kind === "utility" && cardMultiplier) {
      const dice = rollDice(g);
      diceTotal = dice[0] + dice[1];
      log(g, `${p.name} rolled ${diceTotal} for the utility.`, p.id);
    }
    const rent = rentFor(g, index, diceTotal, cardMultiplier);
    charge(g, p, rent, deed.owner, `rent on ${s.name}`);
    return;
  }

  switch (s.kind) {
    case "tax":
      charge(g, p, s.amount ?? 0, null, s.name);
      return;
    case "go_to_jail":
      sendToJail(g, p);
      return;
    case "chance":
    case "community_chest":
      drawCard(g, p, s.kind, canRollAgain);
      return;
  }
}

function drawCard(g: GameState, p: Player, deck: DeckName, canRollAgain: boolean): void {
  const id = g.decks[deck].shift();
  if (!id) return;
  const card = CARDS[id];
  if (card.effect.kind !== "jailCard") g.decks[deck].push(id);
  g.lastCard = { deck, text: card.text };
  log(g, `${p.name} drew ${DECK_LABELS[deck]}: "${card.text}"`, p.id);

  const e = card.effect;
  switch (e.kind) {
    case "advance":
      advanceTo(g, p, e.to);
      resolveLanding(g, p, canRollAgain);
      return;
    case "advanceNearest": {
      const targets = e.target === "railroad" ? RAILROAD_INDICES : UTILITY_INDICES;
      const dest = targets.find((i) => i > p.position) ?? targets[0];
      advanceTo(g, p, dest);
      resolveLanding(g, p, canRollAgain, true);
      return;
    }
    case "back":
      p.position = (p.position - e.spaces + BOARD.length) % BOARD.length;
      resolveLanding(g, p, canRollAgain);
      return;
    case "collect":
      p.money += e.amount;
      return;
    case "pay":
      charge(g, p, e.amount, null, "a card");
      return;
    case "payEachPlayer":
      for (const other of activePlayers(g)) {
        if (other.id !== p.id) charge(g, p, e.amount, other.id, "a card");
      }
      return;
    case "collectFromEachPlayer":
      for (const other of activePlayers(g)) {
        if (other.id !== p.id) charge(g, other, e.amount, p.id, "a card");
      }
      return;
    case "repairs": {
      let houses = 0;
      let hotels = 0;
      for (const i of ownedBy(g, p.id)) {
        const h = g.deeds[i].houses;
        if (h === 5) hotels += 1;
        else houses += h;
      }
      charge(g, p, houses * e.perHouse + hotels * e.perHotel, null, "repairs");
      return;
    }
    case "goToJail":
      sendToJail(g, p);
      return;
    case "jailCard":
      p.jailCards[deck] = true;
      return;
  }
}

/** Pays immediately if possible, otherwise records a debt the player must settle. */
function charge(
  g: GameState,
  payer: Player,
  amount: number,
  creditor: number | null,
  reason: string
): void {
  if (amount <= 0) return;
  if (payer.debts.length === 0 && payer.money >= amount) {
    transfer(g, payer.id, amount, creditor, reason);
    return;
  }
  payer.debts.push({ creditor, amount, reason });
  const to = creditor === null ? "the bank" : g.players[creditor].name;
  log(g, `${payer.name} owes ${to} $${amount} for ${reason} and must raise funds.`, payer.id);
}

function transfer(
  g: GameState,
  from: number,
  amount: number,
  to: number | null,
  reason: string
): void {
  const payer = g.players[from];
  payer.money -= amount;
  if (to !== null) g.players[to].money += amount;
  const toName = to === null ? "the bank" : g.players[to].name;
  log(g, `${payer.name} paid ${toName} $${amount} for ${reason}.`, from);
}

function settleAuction(g: GameState): void {
  const phase = g.phase;
  if (phase.kind !== "auction") return;
  const s = ownable(phase.space);
  const done = { kind: "postRoll", canRollAgain: phase.canRollAgain } as const;

  if (phase.bidders.length === 0) {
    log(g, `Nobody bid on ${s.name}. It stays with the bank.`);
    g.phase = done;
    return;
  }
  if (phase.bidders.length === 1 && phase.highBidder === phase.bidders[0]) {
    const winner = g.players[phase.highBidder];
    winner.money -= phase.highBid;
    g.deeds[phase.space].owner = winner.id;
    log(g, `${winner.name} won ${s.name} at auction for $${phase.highBid}.`, winner.id);
    g.phase = done;
  }
}

function moveSide(g: GameState, from: Player, to: Player, side: TradeSide): void {
  from.money -= side.cash;
  to.money += side.cash;
  for (const i of side.spaces) {
    g.deeds[i].owner = to.id;
    if (g.deeds[i].mortgaged) {
      const interest = Math.round(ownable(i).mortgageValue * 0.1);
      charge(g, to, interest, null, `interest on mortgaged ${BOARD[i].name}`);
    }
  }
  for (let k = 0; k < side.jailCards; k++) {
    const deck: DeckName = from.jailCards.chance ? "chance" : "community_chest";
    from.jailCards[deck] = false;
    to.jailCards[deck] = true;
  }
}

function bankrupt(g: GameState, p: Player): void {
  const playerDebts = p.debts.filter((d) => d.creditor !== null);
  const largest = playerDebts.sort((a, b) => b.amount - a.amount)[0];
  const creditor = largest ? g.players[largest.creditor as number] : null;

  for (const i of ownedBy(g, p.id)) {
    const s = ownable(i);
    const deed = g.deeds[i];
    if (s.kind === "property" && deed.houses > 0) {
      if (deed.houses === 5) g.hotelsLeft += 1;
      else g.housesLeft += deed.houses;
      p.money += (deed.houses * s.buildingCost) / 2;
      deed.houses = 0;
    }
  }

  const owned = ownedBy(g, p.id);
  if (creditor) {
    creditor.money += p.money;
    for (const deck of ["chance", "community_chest"] as const) {
      if (p.jailCards[deck]) creditor.jailCards[deck] = true;
    }
    log(g, `${p.name} is bankrupt! ${creditor.name} takes everything they had.`, p.id);
    for (const i of owned) {
      g.deeds[i].owner = creditor.id;
      if (g.deeds[i].mortgaged) {
        const interest = Math.round(ownable(i).mortgageValue * 0.1);
        charge(g, creditor, interest, null, `interest on mortgaged ${BOARD[i].name}`);
      }
    }
  } else {
    for (const deck of ["chance", "community_chest"] as const) {
      if (p.jailCards[deck]) g.decks[deck].push(JAIL_CARD_IDS[deck]);
    }
    for (const i of owned) g.deeds[i] = { owner: null, houses: 0, mortgaged: false };
    log(g, `${p.name} is bankrupt! Their properties return to the bank.`, p.id);
  }

  p.money = 0;
  p.debts = [];
  p.bankrupt = true;
  p.inJail = false;
  p.jailCards = { chance: false, community_chest: false };
  if (g.pendingTrade && (g.pendingTrade.from === p.id || g.pendingTrade.to === p.id))
    g.pendingTrade = null;

  const remaining = activePlayers(g);
  if (remaining.length === 1) {
    g.phase = { kind: "gameOver", winner: remaining[0].id };
    log(g, `${remaining[0].name} wins the game!`, remaining[0].id);
    return;
  }
  if (g.current === p.id) nextTurn(g);
}

function nextTurn(g: GameState): void {
  g.dice = null;
  g.lastCard = null;
  g.doublesCount = 0;
  g.turn += 1;
  const n = g.players.length;
  let next = g.current;
  do {
    next = (next + 1) % n;
  } while (g.players[next].bankrupt);
  g.current = next;
  g.phase = { kind: "preRoll" };
  log(g, `It's ${g.players[next].name}'s turn.`, next);
}
