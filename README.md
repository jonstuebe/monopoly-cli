# monopoly-cli

Play Monopoly in your terminal against friends (hot-seat) or bots. Built with
[OpenTUI](https://github.com/anomalyco/opentui) and React, running on [Bun](https://bun.sh).

## Getting started

```sh
bun install
bun start            # or: bun src/index.tsx
```

Install it as a global `monopoly` command with `bun link`.

```
monopoly [--seed <n>] [--no-save]
```

- `--seed <n>` makes dice and card shuffles reproducible.
- `--no-save` disables autosave. Games autosave after every move to
  `~/.monopoly-cli/save.json` (override with `MONOPOLY_SAVE`). Pick **Resume
  saved game** on the setup screen to continue.

A terminal of at least 140×45 shows the full board. Smaller terminals get a
compact board, and below about 100×33 the board is hidden.

## Controls

| Key | Action |
| --- | --- |
| `↑`/`↓`, `j`/`k` | Move through menus |
| `enter`, `1`–`9` | Choose an option |
| `esc` | Back out of a panel |
| `?` | Help |
| `f` | Cycle bot speed (slow / normal / fast / instant) |
| `p` | Pause or resume bots |
| `q` | Save and quit |

**Manage properties**: `b` build, `s` sell a building, `m` mortgage, `u` lift a mortgage.

**Trade**: pick a partner, then `tab` switches between what you give and what you get,
`space` toggles a property or jail card, `←`/`→` adjusts cash by $10 (`[`/`]` by $100),
and `p` sends the offer. Bots answer on their own. A human partner is asked to accept or
decline when the offer is sent.

## Rules

Standard US Monopoly rules:

- 2–6 players, any mix of humans and bots. $1,500 to start, $200 for passing GO.
- Property you land on and decline to buy goes to auction among all players.
- Rent doubles on unimproved lots in a complete color set. Railroads pay 25/50/100/200.
  Utilities pay 4× or 10× the dice.
- Houses must be built and sold evenly. A hotel needs four houses on every lot in the set.
  The bank has only 32 houses and 12 hotels.
- Mortgaging pays half the price. Lifting a mortgage costs that amount plus 10%.
  Receiving a mortgaged property in a trade costs 10% interest.
- All 16 Chance and 16 Community Chest cards, including Get Out of Jail Free.
- Jail: roll doubles, pay $50, or use a card. After three failed rolls you pay the
  fine and move. Rolling doubles three times in a row sends you to jail.
- When you owe more than you have, play stops until you raise the money (sell,
  mortgage, trade) or declare bankruptcy. Going bankrupt to a player hands them
  everything. Going bankrupt to the bank returns your properties to the bank.
- Last player standing wins.

## Development

```sh
bun test         # engine rules, full bot-vs-bot simulations, UI tests
bun run typecheck
bun run dev      # restart on file changes
```

```
src/
  index.tsx        CLI entry: argument parsing, renderer setup
  save.ts          autosave/resume
  engine/          pure game logic, no UI
    board.ts       the 40 spaces
    cards.ts       Chance and Community Chest
    game.ts        createGame + applyAction(state, action) -> new state
    rules.ts       read-only queries: rent, build/mortgage/trade checks, who acts next
    bot.ts         bot decision making
  ui/              OpenTUI React components
```

The engine is a pure reducer. `applyAction` validates an action (throwing a
`GameError` with a readable message when it isn't allowed) and returns a new state.
The UI and the bots both drive the game through that one function. Dice and decks
come from a seeded PRNG stored in the state, so a game replays exactly from its seed.
