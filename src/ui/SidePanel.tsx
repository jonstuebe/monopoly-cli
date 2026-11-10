import { TextAttributes } from "@opentui/core";
import { BOARD, GROUP_COLORS, isOwnable, ownable } from "../engine/board";
import { activeActor, jailCardCount, ownedBy, rentFor, totalDebt, unmortgageCost } from "../engine/rules";
import type { GameState } from "../engine/types";
import { fit, money } from "./format";
import { playerColor, spaceAccent, theme } from "./theme";

function PlayerRow({ state, id, width }: { state: GameState; id: number; width: number }) {
  const p = state.players[id];
  const acting = activeActor(state) === id && state.phase.kind !== "gameOver";
  const owned = ownedBy(state, id);
  const flags = [
    p.bot ? "bot" : null,
    p.inJail ? "in jail" : null,
    jailCardCount(p) > 0 ? `${jailCardCount(p)} jail card` : null,
    p.debts.length > 0 ? `owes ${money(totalDebt(p))}` : null,
  ].filter(Boolean);

  if (p.bankrupt) {
    return (
      <box flexDirection="column">
        <text wrapMode="none" fg={theme.dim} attributes={TextAttributes.STRIKETHROUGH}>
          {fit(` ${id + 1} ${p.name}`, width - 12)}
        </text>
        <text wrapMode="none" fg={theme.dim}>{"   bankrupt"}</text>
      </box>
    );
  }

  return (
    <box flexDirection="column">
      <text wrapMode="none">
        <span fg={acting ? theme.accent : theme.dim}>{acting ? "▶" : " "}</span>
        <span bg={playerColor(id)} fg="#000000" attributes={TextAttributes.BOLD}>{String(id + 1)}</span>
        <span fg={playerColor(id)} attributes={TextAttributes.BOLD}>{" " + fit(p.name, width - 15)}</span>
        <span fg={theme.money}>{money(p.money).padStart(9)}</span>
      </text>
      <text wrapMode="none" fg={theme.dim}>
        {fit(`   ${BOARD[p.position].name}${flags.length > 0 ? " · " + flags.join(", ") : ""}`, width - 2)}
      </text>
      <text wrapMode="none">
        <span>{"   "}</span>
        {owned.length === 0 ? <span fg={theme.dim}>no properties</span> : null}
        {owned.map((i) => {
          const s = BOARD[i];
          const color = s.kind === "property" ? GROUP_COLORS[s.group] : spaceAccent(s);
          const glyph = state.deeds[i].mortgaged ? "▫" : s.kind === "property" ? "■" : s.kind === "railroad" ? "▣" : "▪";
          return (
            <span key={i} fg={color}>
              {glyph}
            </span>
          );
        })}
      </text>
    </box>
  );
}

export function DeedCard({ state, index, width }: { state: GameState; index: number; width: number }) {
  const s = BOARD[index];
  const inner = width - 4;
  if (!isOwnable(s)) {
    return (
      <box border borderColor={theme.border} title={s.name} titleAlignment="center" flexDirection="column" flexShrink={0} paddingLeft={1}>
        <text fg={theme.dim}>{describeSpecial(index)}</text>
      </box>
    );
  }
  const deed = state.deeds[index];
  const o = ownable(index);
  const owner = deed.owner === null ? "Bank" : state.players[deed.owner].name;
  const rows: [string, string][] = [];
  if (s.kind === "property") {
    const labels = ["Rent", "1 house", "2 houses", "3 houses", "4 houses", "Hotel"];
    labels.forEach((label, h) => rows.push([`${h === deed.houses && deed.owner !== null ? "▸" : " "}${label}`, money(s.rent[h])]));
    rows.push([" Set (no houses)", money(s.rent[0] * 2)]);
    rows.push([" Building cost", money(s.buildingCost)]);
  } else if (s.kind === "railroad") {
    [1, 2, 3, 4].forEach((n) => rows.push([` ${n} railroad${n > 1 ? "s" : ""}`, money(25 * 2 ** (n - 1))]));
  } else {
    rows.push([" 1 utility", "4x dice"]);
    rows.push([" 2 utilities", "10x dice"]);
  }
  rows.push([" Mortgage value", money(o.mortgageValue)]);
  rows.push([" Unmortgage cost", money(unmortgageCost(index))]);

  return (
    <box
      border
      borderColor={s.kind === "property" ? GROUP_COLORS[s.group] : theme.border}
      title={` ${s.name} `}
      titleAlignment="center"
      flexDirection="column"
      flexShrink={0}
      paddingLeft={1}
      paddingRight={1}
    >
      <text wrapMode="none">
        <span fg={theme.dim}>Price </span>
        <span fg={theme.money}>{money(o.cost)}</span>
        <span fg={theme.dim}>{"  Owner "}</span>
        <span fg={deed.owner === null ? theme.dim : playerColor(deed.owner)}>{owner}</span>
      </text>
      {deed.owner !== null ? (
        <text wrapMode="none" fg={deed.mortgaged ? theme.danger : theme.text}>
          {deed.mortgaged ? "Mortgaged: no rent" : `Rent now: ${s.kind === "utility" ? "dice x" + rentFor(state, index, 1) : money(rentFor(state, index, 7))}`}
        </text>
      ) : null}
      {rows.map(([label, value]) => (
        <text key={label} wrapMode="none">
          <span fg={theme.dim}>{fit(label, inner - value.length)}</span>
          <span>{value}</span>
        </text>
      ))}
    </box>
  );
}

function describeSpecial(index: number): string {
  const s = BOARD[index];
  switch (s.kind) {
    case "go":
      return "Collect $200 salary as you pass.";
    case "jail":
      return "Just visiting, unless you were sent here.";
    case "free_parking":
      return "Nothing happens. Take a breather.";
    case "go_to_jail":
      return "Go directly to jail. Do not pass GO.";
    case "chance":
    case "community_chest":
      return "Draw a card.";
    case "tax":
      return `Pay $${s.amount} to the bank.`;
    default:
      return "";
  }
}

interface SidePanelProps {
  state: GameState;
  width: number;
  inspect: number;
}

export function SidePanel({ state, width, inspect }: SidePanelProps) {
  return (
    <box width={width} flexDirection="column" flexGrow={1} minHeight={0} paddingLeft={1}>
      <box border borderColor={theme.border} title=" Players " flexDirection="column" flexShrink={0}>
        {state.players.map((p) => (
          <PlayerRow key={p.id} state={state} id={p.id} width={width - 1} />
        ))}
      </box>
      <text wrapMode="none" flexShrink={0} fg={theme.dim}>
        {` Bank: ${state.housesLeft} houses, ${state.hotelsLeft} hotels`}
      </text>
      <box flexShrink={1} minHeight={0} overflow="hidden">
        <DeedCard state={state} index={inspect} width={width - 1} />
      </box>
    </box>
  );
}
