import { useRef, useState } from "react";
import { applyAction, createGame, GameError } from "../engine/game";
import type { Action, GameState, PlayerSetup } from "../engine/types";
import { clearSave, loadGame, saveGame } from "../save";
import { GameScreen } from "./GameScreen";
import { SetupScreen } from "./SetupScreen";

interface AppProps {
  /** where to keep the in-progress game; null disables saving */
  savePath: string | null;
  seed?: number;
  onQuit: () => void;
}

export function App({ savePath, seed, onQuit }: AppProps) {
  const [saved, setSaved] = useState(() => (savePath ? loadGame(savePath) : null));
  const [game, setGame] = useState<GameState | null>(null);
  const [speed, setSpeed] = useState(1);
  // Bots dispatch from timers, so keep the latest state outside React's batching.
  const gameRef = useRef<GameState | null>(null);

  const commit = (next: GameState | null) => {
    gameRef.current = next;
    setGame(next);
    if (!savePath) return;
    if (next && next.phase.kind !== "gameOver") saveGame(savePath, next);
    else clearSave(savePath);
  };

  const dispatch = (action: Action, player: number): string | null => {
    const current = gameRef.current;
    if (!current) return "No game in progress.";
    try {
      commit(applyAction(current, { ...action, player }));
      return null;
    } catch (err) {
      if (err instanceof GameError) return err.message;
      return `Unexpected error: ${(err as Error).message}`;
    }
  };

  if (!game) {
    return (
      <SetupScreen
        saved={saved}
        speed={speed}
        onSpeedChange={setSpeed}
        onStart={(players: PlayerSetup[]) => commit(createGame(players, seed))}
        onResume={() => saved && commit(saved)}
        onQuit={onQuit}
      />
    );
  }

  return (
    <GameScreen
      state={game}
      dispatch={dispatch}
      speed={speed}
      onSpeedChange={setSpeed}
      onNewGame={() => {
        setSaved(null);
        commit(null);
      }}
      onQuit={onQuit}
    />
  );
}
