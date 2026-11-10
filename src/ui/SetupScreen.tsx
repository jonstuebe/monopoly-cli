import { TextAttributes } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useState } from "react";
import type { GameState, PlayerSetup } from "../engine/types";
import { center, fit } from "./format";
import { BOT_SPEEDS } from "./GameScreen";
import { playerColor, theme } from "./theme";

const BOT_NAMES = ["Top Hat", "Scottie", "Racecar", "Battleship", "Thimble", "Iron", "Boot", "Wheelbarrow"];

export const DEFAULT_PLAYERS: PlayerSetup[] = [
  { name: "Player 1", bot: false },
  { name: "Top Hat", bot: true },
  { name: "Scottie", bot: true },
  { name: "Racecar", bot: true },
];

type Row =
  | { kind: "resume" }
  | { kind: "player"; index: number }
  | { kind: "add" }
  | { kind: "speed" }
  | { kind: "start" };

interface SetupScreenProps {
  saved: GameState | null;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onStart: (players: PlayerSetup[]) => void;
  onResume: () => void;
  onQuit: () => void;
}

const LOGO = [
  "█▀▄▀█ █▀█ █▄ █ █▀█ █▀█ █▀█ █   █▄█",
  "█ ▀ █ █▄█ █ ▀█ █▄█ █▀▀ █▄█ █▄▄  █ ",
];

export function SetupScreen({ saved, speed, onSpeedChange, onStart, onResume, onQuit }: SetupScreenProps) {
  const { width, height } = useTerminalDimensions();
  const [players, setPlayers] = useState<PlayerSetup[]>(DEFAULT_PLAYERS);
  const [cursor, setCursor] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const rows: Row[] = [
    ...(saved ? [{ kind: "resume" } as const] : []),
    ...players.map((_, index) => ({ kind: "player", index }) as const),
    ...(players.length < 6 ? [{ kind: "add" } as const] : []),
    { kind: "speed" },
    { kind: "start" },
  ];
  const row = rows[Math.min(cursor, rows.length - 1)];

  const update = (index: number, patch: Partial<PlayerSetup>) =>
    setPlayers((ps) => ps.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  const commitName = () => {
    if (editing === null) return;
    const name = draft.trim().slice(0, 16);
    if (name) update(editing, { name });
    setEditing(null);
  };

  const start = () => {
    const names = new Set<string>();
    onStart(
      players.map((p, i) => {
        let name = p.name.trim() || `Player ${i + 1}`;
        while (names.has(name)) name = `${name} ${i + 1}`;
        names.add(name);
        return { ...p, name };
      })
    );
  };

  useKeyboard((key) => {
    if (editing !== null) {
      if (key.name === "escape") setEditing(null);
      return;
    }
    if (key.name === "up" || key.name === "k") return setCursor((c) => (c - 1 + rows.length) % rows.length);
    if (key.name === "down" || key.name === "j") return setCursor((c) => (c + 1) % rows.length);
    if (key.name === "q" || key.name === "escape") return onQuit();
    if (key.name === "s") return start();

    switch (row.kind) {
      case "resume":
        if (key.name === "return" || key.name === "enter") onResume();
        return;
      case "player":
        if (key.name === "return" || key.name === "enter") {
          setDraft(players[row.index].name);
          setEditing(row.index);
        } else if (key.name === "space" || key.name === "tab" || key.name === "b" || key.name === "left" || key.name === "right") {
          const p = players[row.index];
          const name = p.bot ? `Player ${row.index + 1}` : BOT_NAMES.find((n) => !players.some((q) => q.name === n)) ?? "Bot";
          update(row.index, { bot: !p.bot, name });
        } else if ((key.name === "d" || key.name === "backspace" || key.name === "delete") && players.length > 2) {
          setPlayers((ps) => ps.filter((_, i) => i !== row.index));
        }
        return;
      case "add":
        if (key.name === "return" || key.name === "enter" || key.name === "space") {
          const name = BOT_NAMES.find((n) => !players.some((q) => q.name === n)) ?? `Bot ${players.length + 1}`;
          setPlayers((ps) => [...ps, { name, bot: true }]);
        }
        return;
      case "speed":
        if (key.name === "left") onSpeedChange((speed - 1 + BOT_SPEEDS.length) % BOT_SPEEDS.length);
        else if (key.name === "right" || key.name === "return" || key.name === "enter" || key.name === "space")
          onSpeedChange((speed + 1) % BOT_SPEEDS.length);
        return;
      case "start":
        if (key.name === "return" || key.name === "enter") start();
        return;
    }
  });

  const panelWidth = Math.min(60, width - 4);
  const inner = panelWidth - 4;

  const line = (r: Row, i: number) => {
    const selected = i === Math.min(cursor, rows.length - 1);
    const bg = selected ? theme.cellHighlight : undefined;
    const marker = <span fg={theme.accent}>{selected ? "▸ " : "  "}</span>;
    switch (r.kind) {
      case "resume":
        return (
          <text key="resume" wrapMode="none" bg={bg}>
            {marker}
            <span fg={theme.money} attributes={TextAttributes.BOLD}>
              {fit(`Resume saved game (turn ${saved?.turn}, ${saved?.players.filter((p) => !p.bankrupt).length} players left)`, inner - 2)}
            </span>
          </text>
        );
      case "player": {
        const p = players[r.index];
        return (
          <box key={`p${r.index}`} height={1}>
            {editing === r.index ? (
              <box flexDirection="row">
                <text>{"  "}</text>
                <text bg={playerColor(r.index)} fg="#000000">{` ${r.index + 1} `}</text>
                <text> </text>
                <input
                  focused
                  width={20}
                  value={draft}
                  onInput={setDraft}
                  onSubmit={commitName}
                  backgroundColor={theme.panel}
                  focusedBackgroundColor={theme.cellHighlight}
                />
              </box>
            ) : (
              <text wrapMode="none" bg={bg}>
                {marker}
                <span bg={playerColor(r.index)} fg="#000000" attributes={TextAttributes.BOLD}>{` ${r.index + 1} `}</span>
                <span fg={theme.text}>{" " + fit(p.name, 20)}</span>
                <span fg={p.bot ? theme.info : theme.money}>{fit(p.bot ? "Bot" : "Human", 8)}</span>
                <span fg={theme.dim}>{selected ? "enter rename · space human/bot · d remove" : ""}</span>
              </text>
            )}
          </box>
        );
      }
      case "add":
        return (
          <text key="add" wrapMode="none" bg={bg} fg={theme.info}>
            {marker}
            {"+ Add a player"}
          </text>
        );
      case "speed":
        return (
          <text key="speed" wrapMode="none" bg={bg}>
            {marker}
            <span fg={theme.dim}>{"Bot speed  "}</span>
            <span fg={theme.text}>{`◂ ${BOT_SPEEDS[speed].label} ▸`}</span>
          </text>
        );
      case "start":
        return (
          <text key="start" wrapMode="none" bg={bg} fg={theme.accent} attributes={TextAttributes.BOLD}>
            {marker}
            {"Start new game ▶"}
          </text>
        );
    }
  };

  return (
    <box width={width} height={height} backgroundColor={theme.bg} alignItems="center" justifyContent="center" flexDirection="column">
      {LOGO.map((l) => (
        <text key={l} fg={theme.danger} attributes={TextAttributes.BOLD}>
          {l}
        </text>
      ))}
      <text fg={theme.dim}>{center("the property trading game, in your terminal", panelWidth)}</text>
      <text> </text>
      <box border borderColor={theme.border} title=" New game " width={panelWidth} flexDirection="column" paddingLeft={1} paddingRight={1}>
        {rows.map(line)}
      </box>
      <text fg={theme.dim}>↑/↓ move · enter select · s start · q quit</text>
    </box>
  );
}
