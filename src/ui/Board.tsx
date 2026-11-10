import { TextAttributes } from "@opentui/core";
import type { ReactNode } from "react";
import { BOARD, GROUP_COLORS, isOwnable } from "../engine/board";
import type { GameState } from "../engine/types";
import { fit } from "./format";
import { groupTextColor, playerColor, spaceAccent, theme } from "./theme";

/** Column/row of a space on the 11x11 board, GO in the bottom-right. */
export function cellPosition(index: number): { col: number; row: number } {
  if (index <= 10) return { col: 10 - index, row: 10 };
  if (index < 20) return { col: 0, row: 10 - (index - 10) };
  if (index <= 30) return { col: index - 20, row: 0 };
  return { col: 10, row: index - 30 };
}

interface CellProps {
  state: GameState;
  index: number;
  width: number;
  height: number;
  highlighted: boolean;
}

function Cell({ state, index, width, height, highlighted }: CellProps) {
  const s = BOARD[index];
  const { col, row } = cellPosition(index);
  const deed = isOwnable(s) ? state.deeds[index] : null;
  const bg = highlighted ? theme.cellHighlight : (col + row) % 2 === 0 ? theme.cellA : theme.cellB;
  const here = state.players.filter((p) => !p.bankrupt && p.position === index);

  const name =
    s.kind === "property" ? (
      <text wrapMode="none" bg={GROUP_COLORS[s.group]} fg={groupTextColor(s.group)} attributes={TextAttributes.BOLD}>
        {fit(s.short, width - 1)}
      </text>
    ) : (
      <text wrapMode="none" fg={spaceAccent(s)} attributes={TextAttributes.BOLD}>
        {fit(s.short, width - 1)}
      </text>
    );

  let status: ReactNode;
  if (deed && deed.owner !== null) {
    const buildings =
      deed.houses === 5 ? (
        <span fg={theme.hotel} attributes={TextAttributes.BOLD}>{width >= 8 ? "HOTEL" : "H"}</span>
      ) : deed.houses > 0 ? (
        <span fg={theme.house}>{"⌂".repeat(deed.houses)}</span>
      ) : null;
    status = (
      <text wrapMode="none">
        <span bg={playerColor(deed.owner)}> </span>
        <span fg={playerColor(deed.owner)}>{deed.mortgaged ? (width >= 8 ? " MTG " : " M ") : " "}</span>
        {buildings}
      </text>
    );
  } else if (isOwnable(s)) {
    status = <text wrapMode="none" fg={theme.dim}>{fit(`$${s.cost}`, width)}</text>;
  } else if (s.kind === "tax") {
    status = <text wrapMode="none" fg={theme.dim}>{fit(width >= 9 ? `pay $${s.amount}` : `$${s.amount}`, width)}</text>;
  } else {
    status = <text wrapMode="none"> </text>;
  }

  const jailed = here.filter((p) => p.inJail);
  const visiting = here.filter((p) => !p.inJail);
  const tokens = (
    <text wrapMode="none">
      {visiting.map((p) => (
        <span key={p.id} bg={playerColor(p.id)} fg="#000000" attributes={TextAttributes.BOLD}>
          {String(p.id + 1)}
        </span>
      ))}
      {jailed.length > 0 ? <span fg={theme.dim}>{visiting.length > 0 ? "|" : ""}#</span> : null}
      {jailed.map((p) => (
        <span key={p.id} bg={playerColor(p.id)} fg="#000000" attributes={TextAttributes.BOLD}>
          {String(p.id + 1)}
        </span>
      ))}
    </text>
  );

  return (
    <box
      position="absolute"
      left={col * width}
      top={row * height}
      width={width}
      height={height}
      backgroundColor={bg}
      flexDirection="column"
    >
      {name}
      {status}
      {height > 3 ? <text wrapMode="none"> </text> : null}
      {tokens}
    </box>
  );
}

interface BoardProps {
  state: GameState;
  cellWidth: number;
  cellHeight: number;
  highlight: number | null;
  children: ReactNode;
}

export function Board({ state, cellWidth, cellHeight, highlight, children }: BoardProps) {
  return (
    <box width={cellWidth * 11} height={cellHeight * 11} position="relative" flexShrink={0}>
      {BOARD.map((_, i) => (
        <Cell
          key={i}
          state={state}
          index={i}
          width={cellWidth}
          height={cellHeight}
          highlighted={i === highlight}
        />
      ))}
      <box
        position="absolute"
        left={cellWidth}
        top={cellHeight}
        width={cellWidth * 9}
        height={cellHeight * 9}
        flexDirection="column"
        backgroundColor={theme.bg}
      >
        {children}
      </box>
    </box>
  );
}
