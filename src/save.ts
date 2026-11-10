import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { GameState } from "./engine/types";

const SAVE_VERSION = 1;

export function defaultSavePath(): string {
  return process.env.MONOPOLY_SAVE ?? join(homedir(), ".monopoly-cli", "save.json");
}

export function loadGame(path: string): GameState | null {
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    if (data?.version !== SAVE_VERSION || !Array.isArray(data.state?.players)) return null;
    const state = data.state as GameState;
    return state.phase.kind === "gameOver" ? null : state;
  } catch {
    return null;
  }
}

export function saveGame(path: string, state: GameState): void {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify({ version: SAVE_VERSION, state }));
  } catch {
    // Saving is best effort; a read-only home directory shouldn't stop the game.
  }
}

export function clearSave(path: string): void {
  rmSync(path, { force: true });
}
