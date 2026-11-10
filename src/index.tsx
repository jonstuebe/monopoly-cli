#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { defaultSavePath } from "./save";
import { App } from "./ui/App";

const HELP = `monopoly - play Monopoly in your terminal

Usage: monopoly [options]

Options:
  --seed <n>     use a fixed random seed (reproducible dice and cards)
  --no-save      don't save or resume games
  -h, --help     show this help

Games are saved to ${defaultSavePath()} (override with MONOPOLY_SAVE).`;

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) {
  console.log(HELP);
  process.exit(0);
}

const seedArg = args.indexOf("--seed");
const seed = seedArg === -1 ? undefined : Number.parseInt(args[seedArg + 1] ?? "", 10);
if (seed !== undefined && !Number.isFinite(seed)) {
  console.error("--seed needs a number");
  process.exit(1);
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const quit = () => {
  renderer.destroy();
  process.exit(0);
};

createRoot(renderer).render(
  <App savePath={args.includes("--no-save") ? null : defaultSavePath()} seed={seed} onQuit={quit} />
);
