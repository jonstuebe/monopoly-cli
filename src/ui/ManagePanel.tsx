import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useState } from "react";
import { BOARD, GROUP_COLORS, ownable } from "../engine/board";
import {
  buildError,
  mortgageError,
  ownedBy,
  rentFor,
  sellBuildingError,
  unmortgageCost,
  unmortgageError,
} from "../engine/rules";
import type { Action, GameState } from "../engine/types";
import { fit, money } from "./format";
import { spaceAccent, theme } from "./theme";

function costSummary(index: number): string {
  const s = ownable(index);
  const mortgage = `mortgage +${money(s.mortgageValue)} · lift ${money(unmortgageCost(index))}`;
  if (s.kind !== "property") return mortgage;
  return `house ${money(s.buildingCost)} · sells for ${money(s.buildingCost / 2)} · ${mortgage}`;
}

interface ManagePanelProps {
  state: GameState;
  player: number;
  width: number;
  height: number;
  active: boolean;
  onAction: (action: Action) => void;
  onInspect: (index: number) => void;
  onClose: () => void;
}

export function ManagePanel({ state, player, width, height, active, onAction, onInspect, onClose }: ManagePanelProps) {
  const owned = ownedBy(state, player);
  const [cursor, setCursor] = useState(0);
  const index = owned[Math.min(cursor, owned.length - 1)];

  useEffect(() => {
    if (index !== undefined) onInspect(index);
  }, [index]);

  useKeyboard((key) => {
    if (!active) return;
    if (key.name === "escape" || key.name === "q") return onClose();
    if (owned.length === 0) return;
    if (key.name === "up" || key.name === "k") setCursor((c) => (c - 1 + owned.length) % owned.length);
    else if (key.name === "down" || key.name === "j") setCursor((c) => (c + 1) % owned.length);
    else if (key.name === "b" || key.name === "right") onAction({ type: "build", space: index });
    else if (key.name === "s" || key.name === "left") onAction({ type: "sellBuilding", space: index });
    else if (key.name === "m") onAction({ type: "mortgage", space: index });
    else if (key.name === "u") onAction({ type: "unmortgage", space: index });
  });

  const p = state.players[player];
  const listHeight = Math.max(3, height - 6);
  const start = Math.max(0, Math.min(cursor - Math.floor(listHeight / 2), owned.length - listHeight));
  const visible = owned.slice(start, start + listHeight);
  const nameWidth = Math.max(12, Math.min(26, width - 44));
  const latest = state.log[state.log.length - 1];

  const hints: [string, string | null][] =
    index === undefined
      ? []
      : [
          ["b/→ build", buildError(state, player, index)],
          ["s/← sell", sellBuildingError(state, player, index)],
          ["m mortgage", mortgageError(state, player, index)],
          ["u unmortgage", unmortgageError(state, player, index)],
        ];

  return (
    <box flexDirection="column" paddingLeft={1} paddingRight={1}>
      <text wrapMode="none">
        <span fg={theme.accent} attributes={TextAttributes.BOLD}>{`Manage ${p.name}'s properties`}</span>
        <span fg={theme.money}>{`  ${money(p.money)}`}</span>
      </text>
      <text wrapMode="none" fg={theme.dim}>{fit(`  ${"Property".padEnd(nameWidth)}Buildings  Rent      Status`, width)}</text>
      {owned.length === 0 ? <text fg={theme.dim}>  You don't own any properties yet.</text> : null}
      {visible.map((i) => {
        const s = BOARD[i];
        const deed = state.deeds[i];
        const isCursor = i === index;
        const swatch = s.kind === "property" ? GROUP_COLORS[s.group] : spaceAccent(s);
        const buildings = deed.houses === 5 ? "hotel" : deed.houses > 0 ? `${deed.houses} house${deed.houses > 1 ? "s" : ""}` : "-";
        const rent = s.kind === "utility" ? `${rentFor(state, i, 1)}x dice` : money(rentFor(state, i, 7));
        const status = deed.mortgaged ? `mortgaged (${money(unmortgageCost(i))} to lift)` : "";
        return (
          <text key={i} wrapMode="none" bg={isCursor && active ? theme.cellHighlight : undefined}>
            <span fg={isCursor ? theme.accent : theme.dim}>{isCursor ? "▸" : " "}</span>
            <span bg={swatch}> </span>
            <span fg={deed.mortgaged ? theme.dim : theme.text}>{" " + fit(s.name, nameWidth - 2)}</span>
            <span fg={theme.house}>{fit(buildings, 11)}</span>
            <span fg={deed.mortgaged ? theme.dim : theme.money}>{fit(deed.mortgaged ? "-" : rent, 10)}</span>
            <span fg={theme.danger}>{status}</span>
          </text>
        );
      })}
      <text> </text>
      <text wrapMode="none">
        {hints.map(([label, err]) => (
          <span key={label} fg={err ? theme.dim : theme.info}>{`${label}   `}</span>
        ))}
        <span fg={theme.dim}>esc back</span>
      </text>
      {index !== undefined ? (
        <text wrapMode="none" fg={theme.dim}>
          {fit(costSummary(index), width)}
        </text>
      ) : null}
      {latest ? <text wrapMode="none" fg={theme.text}>{fit(`• ${latest.text}`, width)}</text> : null}
    </box>
  );
}
