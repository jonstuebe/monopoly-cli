import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useState } from "react";
import { fit } from "./format";
import { theme } from "./theme";

export interface MenuItem {
  label: string;
  /** shown dimmed after the label */
  hint?: string;
  /** reason the item can't be chosen right now */
  disabled?: string | null;
  onSelect: () => void;
}

interface MenuProps {
  items: MenuItem[];
  active: boolean;
  width: number;
}

export function Menu({ items, active, width }: MenuProps) {
  const [cursor, setCursor] = useState(0);
  const labels = items.map((i) => i.label).join("|");

  // Reset the cursor whenever the set of choices changes.
  useEffect(() => {
    const first = items.findIndex((i) => !i.disabled);
    setCursor(first === -1 ? 0 : first);
  }, [labels]);

  useKeyboard((key) => {
    if (!active || items.length === 0) return;
    if (key.name === "up" || key.name === "k") {
      setCursor((c) => (c - 1 + items.length) % items.length);
    } else if (key.name === "down" || key.name === "j") {
      setCursor((c) => (c + 1) % items.length);
    } else if (key.name === "return" || key.name === "enter") {
      const item = items[Math.min(cursor, items.length - 1)];
      if (item && !item.disabled) item.onSelect();
    } else if (/^[1-9]$/.test(key.name)) {
      const item = items[Number(key.name) - 1];
      if (item && !item.disabled) item.onSelect();
    }
  });

  const selected = items[Math.min(cursor, items.length - 1)];

  return (
    <box flexDirection="column">
      {items.map((item, i) => {
        const isCursor = i === cursor && active;
        const fg = item.disabled ? theme.dim : isCursor ? "#000000" : theme.text;
        return (
          <text key={item.label} wrapMode="none" bg={isCursor ? theme.accent : undefined} fg={fg}>
            <span attributes={isCursor ? TextAttributes.BOLD : TextAttributes.NONE}>
              {fit(` ${i + 1}  ${item.label}${item.hint ? `  ${item.hint}` : ""}`, width)}
            </span>
          </text>
        );
      })}
      {selected?.disabled && active ? (
        <text wrapMode="none" fg={theme.danger}>{fit(`    ${selected.disabled}`, width)}</text>
      ) : null}
    </box>
  );
}
