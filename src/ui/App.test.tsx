import { afterEach, expect, test } from "bun:test";
import { testRender } from "@opentui/react/test-utils";
import { createGame } from "../engine/game";
import { App } from "./App";
import { LogView } from "./GameScreen";

type Setup = Awaited<ReturnType<typeof testRender>>;
let current: Setup | null = null;

afterEach(async () => {
  await current?.dispose();
  current = null;
});

async function render(width = 140, height = 45) {
  current = await testRender(<App savePath={null} seed={7} onQuit={() => {}} />, { width, height });
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
  await current.renderOnce();
  return current;
}

async function settle(t: Setup) {
  // a lone ESC is only reported once the parser gives up waiting for a sequence
  await Bun.sleep(30);
  for (let i = 0; i < 3; i++) await t.renderOnce();
  return t.captureCharFrame();
}

test("setup screen lists default players", async () => {
  const t = await render();
  const frame = t.captureCharFrame();
  expect(frame).toContain("Player 1");
  expect(frame).toContain("Top Hat");
  expect(frame).toContain("Start new game");
});

test("a human can roll, buy and open the panels", async () => {
  const t = await render();
  t.mockInput.pressKey("s");
  let frame = await settle(t);
  expect(frame).toContain("M O N O P O L Y");
  expect(frame).toContain("Roll dice");

  t.mockInput.pressEnter();
  frame = await settle(t);
  // seed 7: Player 1 rolls double fours onto Vermont Avenue
  expect(frame).toContain("Vermont Avenue is for sale");

  t.mockInput.pressEnter();
  frame = await settle(t);
  expect(frame).toContain("bought Vermont Avenue");
  expect(frame).toContain("Roll again");

  t.mockInput.pressKey("2");
  frame = await settle(t);
  expect(frame).toContain("Manage Player 1's properties");
  expect(frame).toContain("Vermont Avenue");
  t.mockInput.pressKey("m");
  frame = await settle(t);
  expect(frame).toContain("mortgaged Vermont Avenue for $50");
  t.mockInput.pressEscape();
  frame = await settle(t);
  expect(frame).toContain("Roll again");

  t.mockInput.pressKey("3");
  frame = await settle(t);
  expect(frame).toContain("Trade with whom?");
  t.mockInput.pressEnter();
  frame = await settle(t);
  expect(frame).toContain("You give (Player 1)");
  expect(frame).toContain("You get (Top Hat)");
  t.mockInput.pressKey("p");
  frame = await settle(t);
  expect(frame).toContain("The trade is empty.");
  t.mockInput.pressEscape();
  await settle(t);
  t.mockInput.pressEscape();
  frame = await settle(t);
  expect(frame).toContain("Roll again");
});

test("falls back to a board-less layout in small terminals", async () => {
  const t = await render(90, 30);
  t.mockInput.pressKey("s");
  const frame = await settle(t);
  expect(frame).toContain("Roll dice");
  expect(frame).toContain("Players");
});

test("an all-bot game plays itself through the UI", async () => {
  const t = await render();
  t.mockInput.pressKey(" "); // make Player 1 a bot
  await settle(t);
  t.mockInput.pressKey("s");
  await settle(t);
  t.mockInput.pressKey("f");
  t.mockInput.pressKey("f");
  const deadline = Date.now() + 2500;
  while (Date.now() < deadline) {
    await t.renderOnce();
    await Bun.sleep(5);
  }
  const frame = t.captureCharFrame();
  expect(frame).not.toContain("Bot error");
  expect(frame).not.toContain("Unexpected error");
  const turn = Number(frame.match(/turn (\d+)/)?.[1] ?? 0);
  expect(turn).toBeGreaterThan(3);
}, 10000);

test("the log shows the newest entries in order when it overflows", async () => {
  const state = createGame([
    { name: "Ada", bot: false },
    { name: "Bo", bot: false },
  ]);
  state.log = Array.from({ length: 50 }, (_, i) => ({ text: `entry ${i}`, player: i % 2 }));
  current = await testRender(
    <box height={8} flexDirection="column">
      <LogView state={state} width={30} />
    </box>,
    { width: 40, height: 10 }
  );
  await current.renderOnce();
  const shown = current
    .captureCharFrame()
    .split("\n")
    .slice(0, 8)
    .map((line) => line.match(/entry (\d+)/)?.[1]);
  expect(shown).toEqual(["42", "43", "44", "45", "46", "47", "48", "49"]);
});
