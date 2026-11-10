import type {
  ColorGroup,
  OwnableSpace,
  PropertySpace,
  RailroadSpace,
  Space,
  UtilitySpace,
} from "./types";

function property(
  name: string,
  short: string,
  group: ColorGroup,
  cost: number,
  rent: PropertySpace["rent"],
  buildingCost: number
): PropertySpace {
  return {
    kind: "property",
    name,
    short,
    group,
    cost,
    rent,
    buildingCost,
    mortgageValue: cost / 2,
  };
}

function railroad(name: string, short: string): RailroadSpace {
  return { kind: "railroad", name, short, cost: 200, mortgageValue: 100 };
}

function utility(name: string, short: string): UtilitySpace {
  return { kind: "utility", name, short, cost: 150, mortgageValue: 75 };
}

export const BOARD: readonly Space[] = [
  { kind: "go", name: "GO", short: "GO" },
  property("Mediterranean Avenue", "Medit.", "brown", 60, [2, 10, 30, 90, 160, 250], 50),
  { kind: "community_chest", name: "Community Chest", short: "Chest" },
  property("Baltic Avenue", "Baltic", "brown", 60, [4, 20, 60, 180, 320, 450], 50),
  { kind: "tax", name: "Income Tax", short: "Inc Tax", amount: 200 },
  railroad("Reading Railroad", "Read RR"),
  property("Oriental Avenue", "Oriental", "light_blue", 100, [6, 30, 90, 270, 400, 550], 50),
  { kind: "chance", name: "Chance", short: "Chance" },
  property("Vermont Avenue", "Vermont", "light_blue", 100, [6, 30, 90, 270, 400, 550], 50),
  property("Connecticut Avenue", "Conn.", "light_blue", 120, [8, 40, 100, 300, 450, 600], 50),
  { kind: "jail", name: "Jail / Just Visiting", short: "Jail" },
  property("St. Charles Place", "St.Chas", "pink", 140, [10, 50, 150, 450, 625, 750], 100),
  utility("Electric Company", "Electric"),
  property("States Avenue", "States", "pink", 140, [10, 50, 150, 450, 625, 750], 100),
  property("Virginia Avenue", "Virginia", "pink", 160, [12, 60, 180, 500, 700, 900], 100),
  railroad("Pennsylvania Railroad", "Penn RR"),
  property("St. James Place", "St.James", "orange", 180, [14, 70, 200, 550, 750, 950], 100),
  { kind: "community_chest", name: "Community Chest", short: "Chest" },
  property("Tennessee Avenue", "Tenn.", "orange", 180, [14, 70, 200, 550, 750, 950], 100),
  property("New York Avenue", "New York", "orange", 200, [16, 80, 220, 600, 800, 1000], 100),
  { kind: "free_parking", name: "Free Parking", short: "Parking" },
  property("Kentucky Avenue", "Kentucky", "red", 220, [18, 90, 250, 700, 875, 1050], 150),
  { kind: "chance", name: "Chance", short: "Chance" },
  property("Indiana Avenue", "Indiana", "red", 220, [18, 90, 250, 700, 875, 1050], 150),
  property("Illinois Avenue", "Illinois", "red", 240, [20, 100, 300, 750, 925, 1100], 150),
  railroad("B. & O. Railroad", "B&O RR"),
  property("Atlantic Avenue", "Atlantic", "yellow", 260, [22, 110, 330, 800, 975, 1150], 150),
  property("Ventnor Avenue", "Ventnor", "yellow", 260, [22, 110, 330, 800, 975, 1150], 150),
  utility("Water Works", "Water Wk"),
  property("Marvin Gardens", "Marvin G", "yellow", 280, [24, 120, 360, 850, 1025, 1200], 150),
  { kind: "go_to_jail", name: "Go To Jail", short: "To Jail" },
  property("Pacific Avenue", "Pacific", "green", 300, [26, 130, 390, 900, 1100, 1275], 200),
  property("North Carolina Avenue", "N.Carol.", "green", 300, [26, 130, 390, 900, 1100, 1275], 200),
  { kind: "community_chest", name: "Community Chest", short: "Chest" },
  property("Pennsylvania Avenue", "Penn Ave", "green", 320, [28, 150, 450, 1000, 1200, 1400], 200),
  railroad("Short Line", "Short Ln"),
  { kind: "chance", name: "Chance", short: "Chance" },
  property("Park Place", "Park Pl", "dark_blue", 350, [35, 175, 500, 1100, 1300, 1500], 200),
  { kind: "tax", name: "Luxury Tax", short: "Lux Tax", amount: 100 },
  property("Boardwalk", "Boardwalk", "dark_blue", 400, [50, 200, 600, 1400, 1700, 2000], 200),
];

export const JAIL = 10;
export const GO_SALARY = 200;
export const JAIL_FINE = 50;
export const STARTING_MONEY = 1500;
export const TOTAL_HOUSES = 32;
export const TOTAL_HOTELS = 12;

export const GROUP_COLORS: Record<ColorGroup, string> = {
  brown: "#8B4513",
  light_blue: "#87CEEB",
  pink: "#D93A96",
  orange: "#F7941D",
  red: "#ED1B24",
  yellow: "#FEF200",
  green: "#1FB25A",
  dark_blue: "#0072BB",
};

export function space(index: number): Space {
  return BOARD[index];
}

export function isOwnable(s: Space): s is OwnableSpace {
  return s.kind === "property" || s.kind === "railroad" || s.kind === "utility";
}

export const OWNABLE_INDICES: readonly number[] = BOARD.flatMap((s, i) =>
  isOwnable(s) ? [i] : []
);

export function ownable(index: number): OwnableSpace {
  const s = BOARD[index];
  if (!isOwnable(s)) throw new Error(`${s.name} cannot be owned`);
  return s;
}

export function groupIndices(group: ColorGroup): number[] {
  return BOARD.flatMap((s, i) =>
    s.kind === "property" && s.group === group ? [i] : []
  );
}

export const RAILROAD_INDICES = BOARD.flatMap((s, i) =>
  s.kind === "railroad" ? [i] : []
);
export const UTILITY_INDICES = BOARD.flatMap((s, i) =>
  s.kind === "utility" ? [i] : []
);

/** Indices that trade or build as a set with this space. */
export function setIndices(index: number): number[] {
  const s = ownable(index);
  if (s.kind === "property") return groupIndices(s.group);
  return s.kind === "railroad" ? RAILROAD_INDICES : UTILITY_INDICES;
}
