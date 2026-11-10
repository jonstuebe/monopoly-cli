import { TextAttributes } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useEffect, useState } from "react";
import { DECK_LABELS } from "../engine/cards";
import { botAction } from "../engine/bot";
import { activeActor } from "../engine/rules";
import type { Action, GameState, TradeOffer } from "../engine/types";
import { promptFor, type ActionChoice } from "./actions";
import { Board } from "./Board";
import { center, fit, money } from "./format";
import { ManagePanel } from "./ManagePanel";
import { Menu } from "./Menu";
import { SidePanel } from "./SidePanel";
import { playerColor, theme } from "./theme";
import { TradePanel } from "./TradePanel";

export const BOT_SPEEDS = [
  { label: "slow", ms: 1200 },
  { label: "normal", ms: 600 },
  { label: "fast", ms: 200 },
  { label: "instant", ms: 20 },
] as const;

type Mode = "menu" | "manage" | "trade" | "bid" | "help" | "quit";

interface GameScreenProps {
  state: GameState;
  /** Applies an action; returns an error message if it was rejected. */
  dispatch: (action: Action, player: number) => string | null;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onNewGame: () => void;
  onQuit: () => void;
}

const BOT_FALLBACKS: Action[] = [
  { type: "rejectTrade" },
  { type: "passBid" },
  { type: "declineBuy" },
  { type: "endTurn" },
  { type: "declareBankruptcy" },
];

export function GameScreen({ state, dispatch, speed, onSpeedChange, onNewGame, onQuit }: GameScreenProps) {
  const { width, height } = useTerminalDimensions();
  const [mode, setMode] = useState<Mode>("menu");
  const [flash, setFlash] = useState<string | null>(null);
  const [inspect, setInspect] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [bidText, setBidText] = useState("");

  const actor = activeActor(state);
  const actorPlayer = state.players[actor];
  const over = state.phase.kind === "gameOver";
  const humanTurn = !actorPlayer.bot && !over;

  // Leave panels when control passes to someone else.
  useEffect(() => {
    if (mode !== "help" && mode !== "quit") setMode("menu");
    setInspect(null);
  }, [actor]);

  useEffect(() => {
    if (over || paused || actorPlayer.bot === false) return;
    const timer = setTimeout(() => {
      const err = dispatch(botAction(state, actor), actor);
      if (!err) return;
      setFlash(`Bot error: ${err}`);
      for (const fallback of BOT_FALLBACKS) {
        if (!dispatch(fallback, actor)) return;
      }
    }, BOT_SPEEDS[speed].ms);
    return () => clearTimeout(timer);
  }, [state, speed, paused]);

  const run = (action: Action) => {
    setFlash(dispatch(action, actor));
  };

  const choose = (choice: ActionChoice) => {
    if (choice.run === "manage" || choice.run === "trade") {
      setFlash(null);
      setMode(choice.run);
    } else if (choice.run === "customBid") {
      setBidText("");
      setMode("bid");
    } else {
      run(choice.run);
    }
  };

  useKeyboard((key) => {
    if (mode === "help") {
      setMode("menu");
      return;
    }
    if (mode !== "menu") return;
    if (key.name === "?" || key.sequence === "?") setMode("help");
    else if (key.name === "q") setMode("quit");
    else if (key.name === "f") onSpeedChange((speed + 1) % BOT_SPEEDS.length);
    else if (key.name === "p") setPaused((p) => !p);
  });

  // Layout
  const cellWidth = Math.min(10, Math.floor((width - 32) / 11));
  const sideWidth = Math.max(32, Math.min(48, width - cellWidth * 11));
  const cellHeight = height >= 44 ? 4 : 3;
  const showBoard = cellWidth >= 6 && height >= cellHeight * 11;
  const innerWidth = showBoard ? cellWidth * 9 : Math.max(20, width - sideWidth - 2);
  const innerHeight = showBoard ? cellHeight * 9 : height - 2;

  const phaseSpace =
    state.phase.kind === "buyDecision" || state.phase.kind === "auction" ? state.phase.space : null;
  const inspected = inspect ?? phaseSpace ?? actorPlayer.position;

  const prompt = promptFor(state, actor);
  const contentWidth = innerWidth - 2;

  let body;
  if (mode === "manage") {
    body = (
      <ManagePanel
        state={state}
        player={actor}
        width={contentWidth}
        height={innerHeight - 2}
        active={humanTurn}
        onAction={run}
        onInspect={setInspect}
        onClose={() => {
          setMode("menu");
          setInspect(null);
        }}
      />
    );
  } else if (mode === "trade") {
    body = (
      <TradePanel
        state={state}
        player={actor}
        width={contentWidth}
        height={innerHeight - 2}
        active={humanTurn}
        onInspect={setInspect}
        onPropose={(offer: TradeOffer) => {
          const err = dispatch({ type: "proposeTrade", offer }, actor);
          setFlash(err);
          if (!err) {
            setMode("menu");
            setInspect(null);
          }
        }}
        onClose={() => {
          setMode("menu");
          setInspect(null);
        }}
      />
    );
  } else if (mode === "help") {
    body = <Help />;
  } else {
    body = (
      <ActionArea
        state={state}
        actor={actor}
        width={contentWidth}
        height={innerHeight - 2}
        mode={mode}
        humanTurn={humanTurn}
        prompt={prompt}
        paused={paused}
        bidText={bidText}
        onBidText={setBidText}
        onBidSubmit={(text) => {
          const amount = Number.parseInt(text.replace(/[^0-9]/g, ""), 10);
          setMode("menu");
          if (Number.isFinite(amount)) run({ type: "bid", amount });
        }}
        onBidCancel={() => setMode("menu")}
        onChoose={choose}
        onNewGame={onNewGame}
        onQuit={onQuit}
        onQuitCancel={() => setMode("menu")}
      />
    );
  }

  const content = (
    <box flexDirection="column" width={innerWidth} height={innerHeight} paddingLeft={1} paddingTop={1}>
      <box flexDirection="column" flexGrow={1} flexShrink={1} minHeight={0} overflow="hidden">
        {body}
      </box>
      {flash ? (
        <text wrapMode="none" flexShrink={0} fg={theme.danger}>{fit(` ${flash}`, contentWidth)}</text>
      ) : null}
    </box>
  );

  return (
    <box flexDirection="row" width={width} height={height} backgroundColor={theme.bg}>
      {showBoard ? (
        <Board state={state} cellWidth={cellWidth} cellHeight={cellHeight} highlight={inspected}>
          {content}
        </Board>
      ) : (
        <box border borderColor={theme.border} title=" MONOPOLY ">
          {content}
        </box>
      )}
      <box flexDirection="column" height={height}>
        <SidePanel state={state} width={sideWidth} inspect={inspected} />
        <text wrapMode="none" flexShrink={0} fg={theme.dim}>
          {fit(`  bots: ${BOT_SPEEDS[speed].label}${paused ? " (paused)" : ""}`, sideWidth)}
        </text>
        <text wrapMode="none" flexShrink={0} fg={theme.dim}>
          {fit("  ? help · f speed · p pause · q quit", sideWidth)}
        </text>
      </box>
    </box>
  );
}

interface ActionAreaProps {
  state: GameState;
  actor: number;
  width: number;
  height: number;
  mode: Mode;
  humanTurn: boolean;
  prompt: ReturnType<typeof promptFor>;
  paused: boolean;
  bidText: string;
  onBidText: (text: string) => void;
  onBidSubmit: (text: string) => void;
  onBidCancel: () => void;
  onChoose: (choice: ActionChoice) => void;
  onNewGame: () => void;
  onQuit: () => void;
  onQuitCancel: () => void;
}

function ActionArea(props: ActionAreaProps) {
  const { state, actor, width, height, mode, humanTurn, prompt, paused } = props;
  const p = state.players[actor];

  useKeyboard((key) => {
    if (mode === "bid" && key.name === "escape") props.onBidCancel();
  });

  const header = (
    <box flexDirection="column" flexShrink={0}>
      <text wrapMode="none" fg={theme.accent} attributes={TextAttributes.BOLD}>
        {center("M O N O P O L Y", width)}
      </text>
      <text wrapMode="none" fg={theme.dim}>
        {center(`turn ${state.turn}${state.dice ? `   ·   dice [${state.dice[0]}] [${state.dice[1]}]` : ""}`, width)}
      </text>
    </box>
  );

  let controls;
  if (state.phase.kind === "gameOver") {
    const winner = state.players[state.phase.winner];
    controls = (
      <box flexDirection="column" flexShrink={0}>
        <text wrapMode="none" fg={playerColor(winner.id)} attributes={TextAttributes.BOLD}>
          {center(`${winner.name} wins with ${money(winner.money)}!`, width)}
        </text>
        <text> </text>
        <Menu
          active
          width={width}
          items={[
            { label: "New game", onSelect: props.onNewGame },
            { label: "Quit", onSelect: props.onQuit },
          ]}
        />
      </box>
    );
  } else if (mode === "quit") {
    controls = (
      <box flexDirection="column" flexShrink={0}>
        <text fg={theme.accent}>Quit? Your game is saved and can be resumed later.</text>
        <Menu
          active
          width={width}
          items={[
            { label: "Keep playing", onSelect: props.onQuitCancel },
            { label: "Save and quit", onSelect: props.onQuit },
          ]}
        />
      </box>
    );
  } else {
    controls = (
      <box flexDirection="column" flexShrink={0}>
        <text wrapMode="none">
          <span bg={playerColor(actor)} fg="#000000" attributes={TextAttributes.BOLD}>{` ${actor + 1} `}</span>
          <span fg={theme.text} attributes={TextAttributes.BOLD}>{` ${prompt.title}`}</span>
          <span fg={theme.money}>{`  ${money(p.money)}`}</span>
        </text>
        {prompt.lines.map((line) => (
          <text key={line} fg={theme.dim} wrapMode="word">
            {line}
          </text>
        ))}
        {state.lastCard ? (
          <box border borderColor={theme.borderActive} title={` ${DECK_LABELS[state.lastCard.deck]} `} paddingLeft={1}>
            <text wrapMode="word">{state.lastCard.text}</text>
          </box>
        ) : null}
        {humanTurn ? (
          mode === "bid" ? (
            <box title=" Your bid (enter to submit, esc to cancel) " border borderColor={theme.borderActive} height={3}>
              <input
                focused
                value={props.bidText}
                placeholder={`more than ${state.phase.kind === "auction" ? money(state.phase.highBid) : "$0"}`}
                onInput={props.onBidText}
                onSubmit={(v) => props.onBidSubmit(typeof v === "string" ? v : props.bidText)}
              />
            </box>
          ) : (
            <box paddingTop={1}>
              <Menu
                active={mode === "menu"}
                width={width}
                items={prompt.choices.map((c) => ({
                  label: c.label,
                  hint: c.hint,
                  disabled: c.disabled,
                  onSelect: () => props.onChoose(c),
                }))}
              />
            </box>
          )
        ) : (
          <text fg={theme.dim}>{paused ? `${p.name} is waiting (paused, press p to resume).` : `${p.name} is thinking…`}</text>
        )}
      </box>
    );
  }

  return (
    <box flexDirection="column" height={height}>
      {header}
      {controls}
      <text> </text>
      <LogView state={state} width={width} />
    </box>
  );
}

export function LogView({ state, width }: { state: GameState; width: number }) {
  // Render the tail newest-last; the box shrinks to whatever room is left and
  // clips the oldest lines off the top.
  const entries = state.log.slice(-40);
  return (
    <box flexDirection="column" flexGrow={1} flexShrink={1} minHeight={0} overflow="hidden" justifyContent="flex-end">
      {entries.map((entry, i) => (
        // flexShrink 0 so overflowing rows get clipped rather than squashed to nothing
        <text key={state.log.length - entries.length + i} wrapMode="none" flexShrink={0}>
          <span fg={entry.player === undefined ? theme.dim : playerColor(entry.player)}>{"• "}</span>
          <span fg={i === entries.length - 1 ? theme.text : theme.dim}>{fit(entry.text, width - 2)}</span>
        </text>
      ))}
    </box>
  );
}

function Help() {
  const rows: [string, string][] = [
    ["↑/↓ or j/k", "move through menus"],
    ["enter or 1-9", "choose an option"],
    ["esc", "back out of a panel"],
    ["Manage panel", "b build · s sell · m mortgage · u unmortgage"],
    ["Trade panel", "tab switch side · space toggle · ←/→ cash · p propose"],
    ["f", "cycle bot speed"],
    ["p", "pause or resume bots"],
    ["q", "save and quit"],
    ["", ""],
    ["Rules", "Standard Monopoly. Unbought property goes to auction."],
    ["", "Owning a full color set doubles unimproved rent."],
    ["", "Build evenly. Hotels need 4 houses on every lot in the set."],
    ["", "Three doubles in a row sends you to jail."],
    ["", "Pay off debts or declare bankruptcy before play continues."],
  ];
  return (
    <box flexDirection="column">
      <text fg={theme.accent} attributes={TextAttributes.BOLD}>Help (press any key to close)</text>
      <text> </text>
      {rows.map(([k, v], i) => (
        <text key={i} wrapMode="none">
          <span fg={theme.info}>{k.padEnd(14)}</span>
          <span>{v}</span>
        </text>
      ))}
    </box>
  );
}
