import { BOARD, JAIL_FINE, ownable } from "../engine/board";
import { jailCardCount, totalDebt } from "../engine/rules";
import type { Action, GameState } from "../engine/types";
import { describeTrade, money } from "./format";

export type UiCommand = "manage" | "trade" | "customBid";

export interface ActionChoice {
  label: string;
  hint?: string;
  disabled?: string | null;
  run: Action | UiCommand;
}

export interface Prompt {
  title: string;
  lines: string[];
  choices: ActionChoice[];
}

/** What the active human player is being asked, and the choices they have. */
export function promptFor(state: GameState, actor: number): Prompt {
  const p = state.players[actor];
  const phase = state.phase;
  const tools: ActionChoice[] = [
    { label: "Manage properties", hint: "build, sell, mortgage", run: "manage" },
    { label: "Propose a trade", run: "trade" },
  ];

  if (state.pendingTrade && state.pendingTrade.to === actor) {
    return {
      title: `${state.players[state.pendingTrade.from].name} offers you a trade`,
      lines: describeTrade(state, state.pendingTrade),
      choices: [
        { label: "Accept trade", run: { type: "acceptTrade" } },
        { label: "Decline trade", run: { type: "rejectTrade" } },
      ],
    };
  }

  if (p.debts.length > 0) {
    const owed = totalDebt(p);
    const short = owed - p.money;
    return {
      title: `${p.name} owes ${money(owed)}`,
      lines: [
        ...p.debts.map((d) => {
          const to = d.creditor === null ? "the bank" : state.players[d.creditor].name;
          return `${money(d.amount)} to ${to} for ${d.reason}`;
        }),
        short > 0 ? `Raise ${money(short)} more by selling buildings, mortgaging or trading.` : "You have enough to pay.",
      ],
      choices: [
        {
          label: `Pay ${money(owed)}`,
          disabled: short > 0 ? `You're ${money(short)} short.` : null,
          run: { type: "payDebts" },
        },
        ...tools,
        { label: "Declare bankruptcy", hint: "leave the game", run: { type: "declareBankruptcy" } },
      ],
    };
  }

  switch (phase.kind) {
    case "auction": {
      const s = ownable(phase.space);
      const high =
        phase.highBidder === null
          ? "No bids yet."
          : `High bid: ${money(phase.highBid)} by ${state.players[phase.highBidder].name}.`;
      const bid = (step: number): ActionChoice => {
        const amount = phase.highBid + step;
        return {
          label: `Bid ${money(amount)}`,
          disabled: amount > p.money ? `You only have ${money(p.money)}.` : null,
          run: { type: "bid", amount },
        };
      };
      return {
        title: `Auction: ${s.name} (list price ${money(s.cost)})`,
        lines: [high, `Still bidding: ${phase.bidders.map((id) => state.players[id].name).join(", ")}`],
        choices: [
          bid(10),
          bid(50),
          bid(100),
          { label: "Bid a custom amount…", run: "customBid" },
          { label: "Pass", hint: "drop out of the auction", run: { type: "passBid" } },
        ],
      };
    }

    case "buyDecision": {
      const s = ownable(phase.space);
      return {
        title: `${s.name} is for sale`,
        lines: [`Buy it for ${money(s.cost)}, or send it to auction.`],
        choices: [
          {
            label: `Buy for ${money(s.cost)}`,
            disabled: p.money < s.cost ? `You need ${money(s.cost - p.money)} more.` : null,
            run: { type: "buy" },
          },
          { label: "Auction it", run: { type: "declineBuy" } },
          ...tools,
        ],
      };
    }

    case "preRoll": {
      if (p.inJail) {
        return {
          title: `${p.name} is in jail`,
          lines: [`Attempt ${p.jailTurns + 1} of 3. Roll doubles to get out free.`],
          choices: [
            { label: "Roll for doubles", run: { type: "roll" } },
            {
              label: `Pay ${money(JAIL_FINE)} fine`,
              disabled: p.money < JAIL_FINE ? "You can't afford the fine." : null,
              run: { type: "payJailFine" },
            },
            {
              label: "Use Get Out of Jail Free card",
              disabled: jailCardCount(p) === 0 ? "You don't have one." : null,
              run: { type: "useJailCard" },
            },
            ...tools,
          ],
        };
      }
      return {
        title: `${p.name}'s turn`,
        lines: [`You're on ${BOARD[p.position].name}.`],
        choices: [{ label: "Roll dice", run: { type: "roll" } }, ...tools],
      };
    }

    case "postRoll":
      return {
        title: `${p.name}'s turn`,
        lines: phase.canRollAgain ? ["You rolled doubles, so you go again."] : [],
        choices: [
          phase.canRollAgain
            ? { label: "Roll again", run: { type: "roll" } }
            : { label: "End turn", run: { type: "endTurn" } },
          ...tools,
        ],
      };

    case "gameOver":
      return { title: "Game over", lines: [], choices: [] };
  }
}
