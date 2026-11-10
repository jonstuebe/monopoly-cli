import { describe, expect, test } from "bun:test";
import { botAction } from "./bot";
import { applyAction, createGame, GameError } from "./game";
import { activeActor, buildError, netWorth, rentFor } from "./rules";
import type { Action, GameState } from "./types";

function newGame(seed = 1): GameState {
  return createGame(
    [
      { name: "Ada", bot: false },
      { name: "Bo", bot: false },
      { name: "Cy", bot: false },
    ],
    seed
  );
}

function act(state: GameState, action: Action, player = activeActor(state)) {
  return applyAction(state, { ...action, player });
}

function give(state: GameState, player: number, ...spaces: number[]) {
  for (const i of spaces) state.deeds[i].owner = player;
}

describe("setup", () => {
  test("starts everyone on GO with $1500", () => {
    const g = newGame();
    expect(g.players.map((p) => [p.money, p.position])).toEqual([
      [1500, 0],
      [1500, 0],
      [1500, 0],
    ]);
    expect(g.decks.chance).toHaveLength(16);
    expect(g.decks.community_chest).toHaveLength(16);
  });

  test("rejects too few players", () => {
    expect(() => createGame([{ name: "Solo", bot: false }])).toThrow(GameError);
  });
});

describe("turn order", () => {
  test("only the active player may act", () => {
    const g = newGame();
    expect(() => applyAction(g, { type: "roll", player: 1 })).toThrow("not Bo's move");
  });

  test("rolling moves the player and ending the turn advances", () => {
    let g = newGame(42);
    g = act(g, { type: "roll" });
    const [a, b] = g.dice!;
    expect(g.players[0].position).toBe(a + b);
    if (g.phase.kind === "buyDecision") g = act(g, { type: "buy" });
    while (g.phase.kind === "postRoll" && g.phase.canRollAgain) {
      g = act(g, { type: "roll" });
      if (g.phase.kind === "buyDecision") g = act(g, { type: "buy" });
    }
    if (g.players[0].debts.length) return;
    g = act(g, { type: "endTurn" });
    expect(g.current).toBe(1);
    expect(g.phase.kind).toBe("preRoll");
  });

  test("does not mutate the previous state", () => {
    const g = newGame();
    const before = JSON.stringify(g);
    act(g, { type: "roll" });
    expect(JSON.stringify(g)).toBe(before);
  });
});

describe("rent", () => {
  test("doubles for an unimproved complete set and scales with houses", () => {
    const g = newGame();
    give(g, 1, 1);
    expect(rentFor(g, 1, 7)).toBe(2);
    give(g, 1, 3);
    expect(rentFor(g, 1, 7)).toBe(4);
    g.deeds[1].houses = 3;
    expect(rentFor(g, 1, 7)).toBe(90);
    g.deeds[1].houses = 5;
    expect(rentFor(g, 1, 7)).toBe(250);
  });

  test("railroads and utilities", () => {
    const g = newGame();
    give(g, 1, 5, 15);
    expect(rentFor(g, 5, 7)).toBe(50);
    expect(rentFor(g, 5, 7, true)).toBe(100);
    give(g, 1, 12);
    expect(rentFor(g, 12, 8)).toBe(32);
    give(g, 1, 28);
    expect(rentFor(g, 12, 8)).toBe(80);
  });

  test("mortgaged property collects nothing", () => {
    const g = newGame();
    give(g, 1, 39);
    g.deeds[39].mortgaged = true;
    expect(rentFor(g, 39, 7)).toBe(0);
  });
});

describe("building", () => {
  test("requires the full set and even building", () => {
    let g = newGame();
    give(g, 0, 1);
    expect(buildError(g, 0, 1)).toContain("every property");
    give(g, 0, 3);
    expect(buildError(g, 0, 1)).toBeNull();
    g = act(g, { type: "build", space: 1 });
    expect(g.deeds[1].houses).toBe(1);
    expect(g.housesLeft).toBe(31);
    expect(g.players[0].money).toBe(1450);
    expect(() => act(g, { type: "build", space: 1 })).toThrow("evenly");
    g = act(g, { type: "build", space: 3 });
    g = act(g, { type: "sellBuilding", space: 3 });
    expect(g.players[0].money).toBe(1425);
  });

  test("hotels swap four houses back to the bank", () => {
    let g = newGame();
    give(g, 0, 1, 3);
    g.deeds[1].houses = 4;
    g.deeds[3].houses = 4;
    g.housesLeft -= 8;
    g = act(g, { type: "build", space: 1 });
    expect(g.deeds[1].houses).toBe(5);
    expect(g.hotelsLeft).toBe(11);
    expect(g.housesLeft).toBe(28);
  });

  test("can't mortgage while the set has buildings", () => {
    let g = newGame();
    give(g, 0, 1, 3);
    g = act(g, { type: "build", space: 1 });
    expect(() => act(g, { type: "mortgage", space: 3 })).toThrow("Sell all buildings");
    g = act(g, { type: "sellBuilding", space: 1 });
    g = act(g, { type: "mortgage", space: 3 });
    expect(g.players[0].money).toBe(1500 - 50 + 25 + 30);
    g = act(g, { type: "unmortgage", space: 3 });
    expect(g.players[0].money).toBe(1505 - 33);
  });
});

describe("debts and bankruptcy", () => {
  test("rent you can't afford becomes a debt that blocks the turn", () => {
    let g = newGame();
    give(g, 1, 39);
    g.deeds[39].houses = 5;
    g.players[0].money = 100;
    g.players[0].position = 39;
    // land on Boardwalk via a contrived phase
    g.phase = { kind: "preRoll" };
    g.players[0].debts.push({ creditor: 1, amount: 2000, reason: "rent on Boardwalk" });
    expect(activeActor(g)).toBe(0);
    expect(() => act(g, { type: "roll" })).toThrow("Pay your debts");
    g = act(g, { type: "declareBankruptcy" });
    expect(g.players[0].bankrupt).toBe(true);
    expect(g.players[1].money).toBe(1600);
    expect(g.current).toBe(1);
  });

  test("last player standing wins", () => {
    let g = createGame(
      [
        { name: "Ada", bot: false },
        { name: "Bo", bot: false },
      ],
      3
    );
    give(g, 0, 6);
    g.players[0].debts.push({ creditor: 1, amount: 5000, reason: "test" });
    g = act(g, { type: "declareBankruptcy" });
    expect(g.phase).toEqual({ kind: "gameOver", winner: 1 });
    expect(g.deeds[6].owner).toBe(1);
  });
});

describe("auctions", () => {
  test("declining a purchase auctions it to the highest bidder", () => {
    let g = newGame();
    g.phase = { kind: "buyDecision", space: 39, canRollAgain: false };
    g = act(g, { type: "declineBuy" });
    expect(activeActor(g)).toBe(0);
    g = act(g, { type: "bid", amount: 100 });
    expect(activeActor(g)).toBe(1);
    g = act(g, { type: "bid", amount: 150 });
    g = act(g, { type: "passBid" }); // Cy
    expect(() => act(g, { type: "bid", amount: 120 })).toThrow("more than $150");
    g = act(g, { type: "passBid" }); // Ada
    expect(g.deeds[39].owner).toBe(1);
    expect(g.players[1].money).toBe(1350);
    expect(g.phase.kind).toBe("postRoll");
  });

  test("nobody bidding leaves it with the bank", () => {
    let g = newGame();
    g.phase = { kind: "buyDecision", space: 39, canRollAgain: false };
    g = act(g, { type: "declineBuy" });
    g = act(g, { type: "passBid" });
    g = act(g, { type: "passBid" });
    g = act(g, { type: "passBid" });
    expect(g.deeds[39].owner).toBeNull();
  });
});

describe("trades", () => {
  test("a human recipient answers before play continues", () => {
    let g = newGame();
    give(g, 0, 1);
    give(g, 1, 3);
    g = act(g, {
      type: "proposeTrade",
      offer: {
        from: 0,
        to: 1,
        give: { spaces: [], cash: 100, jailCards: 0 },
        get: { spaces: [3], cash: 0, jailCards: 0 },
      },
    });
    expect(activeActor(g)).toBe(1);
    g = act(g, { type: "acceptTrade" });
    expect(g.deeds[3].owner).toBe(0);
    expect(g.players[0].money).toBe(1400);
    expect(g.players[1].money).toBe(1600);
    expect(activeActor(g)).toBe(0);
  });

  test("can't trade properties whose set has buildings", () => {
    const g = newGame();
    give(g, 0, 1, 3);
    g.deeds[1].houses = 1;
    expect(() =>
      act(g, {
        type: "proposeTrade",
        offer: {
          from: 0,
          to: 1,
          give: { spaces: [3], cash: 0, jailCards: 0 },
          get: { spaces: [], cash: 0, jailCards: 0 },
        },
      })
    ).toThrow("Sell the buildings");
  });
});

describe("bots", () => {
  function simulate(seed: number, players: number, maxActions = 20000) {
    let g = createGame(
      Array.from({ length: players }, (_, i) => ({ name: `Bot ${i + 1}`, bot: true })),
      seed
    );
    let actions = 0;
    while (g.phase.kind !== "gameOver" && actions < maxActions) {
      const actor = activeActor(g);
      g = applyAction(g, { ...botAction(g, actor), player: actor });
      actions++;
      for (const p of g.players) {
        expect(p.money).toBeGreaterThanOrEqual(0);
      }
      expect(g.housesLeft).toBeGreaterThanOrEqual(0);
      expect(g.hotelsLeft).toBeGreaterThanOrEqual(0);
    }
    return { g, actions };
  }

  test.each([1, 2, 3, 4, 5, 6, 7, 8])("bot-only game %d runs without illegal moves", (seed) => {
    const { g } = simulate(seed, 2 + (seed % 5));
    const total = g.players.reduce((sum, p) => sum + netWorth(g, p.id), 0);
    expect(total).toBeGreaterThan(0);
  });

  test("most bot games finish with a winner", () => {
    let finished = 0;
    for (let seed = 100; seed < 110; seed++) {
      const { g } = simulate(seed, 3, 40000);
      if (g.phase.kind === "gameOver") finished++;
    }
    expect(finished).toBeGreaterThanOrEqual(5);
  });
});
