import { GROUP_COLORS } from "../engine/board";
import type { ColorGroup, Space } from "../engine/types";

export const theme = {
  bg: "#161622",
  panel: "#1e1e2e",
  cellA: "#262637",
  cellB: "#202030",
  cellHighlight: "#45456a",
  border: "#45475a",
  borderActive: "#f9e2af",
  text: "#cdd6f4",
  dim: "#7f849c",
  accent: "#f9e2af",
  money: "#a6e3a1",
  danger: "#f38ba8",
  info: "#89b4fa",
  house: "#40c057",
  hotel: "#fa5252",
};

export const PLAYER_COLORS = [
  "#ff6b6b",
  "#4dabf7",
  "#69db7c",
  "#ffd43b",
  "#da77f2",
  "#ffa94d",
];

export function playerColor(id: number): string {
  return PLAYER_COLORS[id % PLAYER_COLORS.length];
}

/** Text color that reads well on top of a color group's swatch. */
export function groupTextColor(group: ColorGroup): string {
  return ["light_blue", "yellow", "orange"].includes(group) ? "#000000" : "#ffffff";
}

export function spaceAccent(s: Space): string {
  switch (s.kind) {
    case "property":
      return GROUP_COLORS[s.group];
    case "railroad":
      return "#adb5bd";
    case "utility":
      return "#74c0fc";
    case "chance":
      return "#ff922b";
    case "community_chest":
      return "#4dabf7";
    case "tax":
      return "#e599f7";
    case "go":
      return "#51cf66";
    case "go_to_jail":
      return "#ff6b6b";
    default:
      return "#ced4da";
  }
}
