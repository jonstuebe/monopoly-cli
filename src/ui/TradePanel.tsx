import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useState } from "react";
import { BOARD, GROUP_COLORS, setIndices } from "../engine/board";
import { activePlayers, jailCardCount, ownedBy, tradeError } from "../engine/rules";
import type { GameState, TradeOffer, TradeSide } from "../engine/types";
import { fit, money } from "./format";
import { Menu } from "./Menu";
import { playerColor, spaceAccent, theme } from "./theme";

type Row = { kind: "cash" } | { kind: "jail" } | { kind: "space"; index: number };

function rowsFor(state: GameState, player: number): Row[] {
  const rows: Row[] = [{ kind: "cash" }];
  if (jailCardCount(state.players[player]) > 0) rows.push({ kind: "jail" });
  for (const index of ownedBy(state, player)) rows.push({ kind: "space", index });
  return rows;
}

const emptySide = (): TradeSide => ({ spaces: [], cash: 0, jailCards: 0 });

interface TradePanelProps {
  state: GameState;
  player: number;
  width: number;
  height: number;
  active: boolean;
  onPropose: (offer: TradeOffer) => void;
  onInspect: (index: number) => void;
  onClose: () => void;
}

export function TradePanel({ state, player, width, height, active, onPropose, onInspect, onClose }: TradePanelProps) {
  const [partner, setPartner] = useState<number | null>(null);
  const [give, setGive] = useState<TradeSide>(emptySide);
  const [get, setGet] = useState<TradeSide>(emptySide);
  const [column, setColumn] = useState<0 | 1>(0);
  const [cursors, setCursors] = useState<[number, number]>([0, 0]);

  const others = activePlayers(state).filter((p) => p.id !== player);
  const owners = partner === null ? [player, player] : [player, partner];
  const rows = [rowsFor(state, owners[0]), rowsFor(state, owners[1])] as const;
  const sides = [give, get] as const;
  const setSides = [setGive, setGet] as const;
  const cursor = Math.min(cursors[column], rows[column].length - 1);
  const row = rows[column][cursor];

  const offer: TradeOffer | null = partner === null ? null : { from: player, to: partner, give, get };
  const error = offer ? tradeError(state, offer) : null;

  useEffect(() => {
    if (row?.kind === "space") onInspect(row.index);
  }, [row?.kind === "space" ? row.index : -1]);

  useKeyboard((key) => {
    if (!active) return;
    if (partner === null) {
      if (key.name === "escape") onClose();
      return;
    }
    const owner = state.players[owners[column]];
    const side = sides[column];
    const setSide = setSides[column];
    const moveCursor = (delta: number) =>
      setCursors((c) => {
        const next: [number, number] = [...c];
        next[column] = (cursor + delta + rows[column].length) % rows[column].length;
        return next;
      });
    const adjustCash = (delta: number) =>
      setSide({ ...side, cash: Math.max(0, Math.min(owner.money, side.cash + delta)) });

    switch (key.name) {
      case "escape":
        setPartner(null);
        return;
      case "tab":
        setColumn((c) => (c === 0 ? 1 : 0));
        return;
      case "up":
      case "k":
        moveCursor(-1);
        return;
      case "down":
      case "j":
        moveCursor(1);
        return;
      case "p":
        if (offer && !error) onPropose(offer);
        return;
    }

    if (row.kind === "cash") {
      if (key.name === "right" || key.name === "=" || key.sequence === "+") adjustCash(key.shift ? 100 : 10);
      else if (key.name === "left" || key.name === "-") adjustCash(key.shift ? -100 : -10);
      else if (key.name === "]") adjustCash(100);
      else if (key.name === "[") adjustCash(-100);
      return;
    }
    if (key.name !== "space" && key.name !== "return" && key.name !== "enter") return;
    if (row.kind === "jail") {
      setSide({ ...side, jailCards: side.jailCards > 0 ? 0 : jailCardCount(owner) });
    } else {
      const has = side.spaces.includes(row.index);
      setSide({
        ...side,
        spaces: has ? side.spaces.filter((i) => i !== row.index) : [...side.spaces, row.index].sort((a, b) => a - b),
      });
    }
  });

  if (partner === null) {
    return (
      <box flexDirection="column" paddingLeft={1} paddingRight={1}>
        <text fg={theme.accent} attributes={TextAttributes.BOLD}>Trade with whom?</text>
        <text> </text>
        <Menu
          active={active}
          width={width - 2}
          items={[
            ...others.map((p) => ({
              label: p.name,
              hint: `${money(p.money)} · ${ownedBy(state, p.id).length} properties${p.bot ? " · bot" : ""}`,
              onSelect: () => {
                setPartner(p.id);
                setGive(emptySide());
                setGet(emptySide());
                setCursors([0, 0]);
                setColumn(0);
              },
            })),
            { label: "Cancel", onSelect: onClose },
          ]}
        />
      </box>
    );
  }

  const colWidth = Math.floor((width - 3) / 2);
  const listHeight = Math.max(3, height - 7);

  const renderColumn = (c: 0 | 1) => {
    const owner = state.players[owners[c]];
    const side = sides[c];
    const colRows = rows[c];
    const colCursor = Math.min(cursors[c], colRows.length - 1);
    const start = Math.max(0, Math.min(colCursor - Math.floor(listHeight / 2), colRows.length - listHeight));
    const focused = column === c && active;
    return (
      <box
        width={colWidth}
        flexDirection="column"
        border
        borderColor={focused ? theme.borderActive : theme.border}
        title={c === 0 ? ` You give (${owner.name}) ` : ` You get (${owner.name}) `}
      >
        {colRows.slice(start, start + listHeight).map((r, k) => {
          const isCursor = start + k === colCursor && focused;
          const bg = isCursor ? theme.cellHighlight : undefined;
          if (r.kind === "cash") {
            return (
              <text key="cash" wrapMode="none" bg={bg}>
                <span fg={theme.money}>{fit(` Cash: ${money(side.cash)}`, colWidth - 14)}</span>
                <span fg={theme.dim}>{isCursor ? "←/→ ±10 [ ]±100" : ""}</span>
              </text>
            );
          }
          if (r.kind === "jail") {
            return (
              <text key="jail" wrapMode="none" bg={bg} fg={side.jailCards > 0 ? theme.accent : theme.text}>
                {fit(` [${side.jailCards > 0 ? "x" : " "}] Get Out of Jail Free ×${jailCardCount(owner)}`, colWidth - 2)}
              </text>
            );
          }
          const s = BOARD[r.index];
          const locked = setIndices(r.index).some((i) => state.deeds[i].houses > 0);
          const picked = side.spaces.includes(r.index);
          const swatch = s.kind === "property" ? GROUP_COLORS[s.group] : spaceAccent(s);
          return (
            <text key={r.index} wrapMode="none" bg={bg}>
              <span fg={picked ? theme.accent : theme.dim}>{` [${picked ? "x" : " "}] `}</span>
              <span bg={swatch}> </span>
              <span fg={locked ? theme.dim : picked ? theme.accent : theme.text}>
                {fit(` ${s.name}${state.deeds[r.index].mortgaged ? " (m)" : ""}${locked ? " (built)" : ""}`, colWidth - 9)}
              </span>
            </text>
          );
        })}
      </box>
    );
  };

  return (
    <box flexDirection="column" paddingLeft={1}>
      <text wrapMode="none">
        <span fg={theme.accent} attributes={TextAttributes.BOLD}>{"Trade with "}</span>
        <span fg={playerColor(partner)} attributes={TextAttributes.BOLD}>{state.players[partner].name}</span>
      </text>
      <box flexDirection="row" gap={1}>
        {renderColumn(0)}
        {renderColumn(1)}
      </box>
      <text wrapMode="none" fg={theme.dim}>
        {fit("tab switch side · ↑/↓ move · space toggle · p propose · esc back", width - 2)}
      </text>
      <text wrapMode="none" fg={error ? theme.danger : theme.money}>
        {fit(error ?? "Press p to send this offer.", width - 2)}
      </text>
    </box>
  );
}
