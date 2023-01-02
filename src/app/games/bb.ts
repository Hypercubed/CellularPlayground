import { ACTIVE, BoundaryType, CellState, createState, EMPTY, Game, GameOptions } from "./game";

const A0 = createState("A0", "a", "A");
const A1 = createState("A1", "A", "A");
const B0 = createState("B0", "b", "B");
const B1 = createState("B1", "B", "B");

type TuringRules = Record<string, string>;

interface BBOptions extends GameOptions {
  rules: TuringRules;
  headStates: string[];
  tapeStates: string[];
}

export const bb2 = {
  A0: "1RB",
  A1: "1LB",
  B0: "1LA",
  B1: "1RH",
};

export const bb3 = {
  A0: "1RB",
  A1: "1RH",
  B0: "0RC",
  B1: "1RB",
  C0: "1LC",
  C1: "1LA"
}

export const bb4 = {
  A0: "1RB",
  A1: "1LB",
  B0: "1LA",
  B1: "0LC",
  C0: "1RH",
  C1: "1LD",
  D0: "1RD",
  D1: "0RA",
}

const BBOptionsDefault = {
  width: 29,
  height: 29,
  boundaryType: BoundaryType.Infinite,
  rules: bb2
}

export class BB extends Game<CellState, BBOptions> {
  stats = {
    Step: 0,
    Alive: 0,
  };

  protected rules: TuringRules;
  protected tapeStates: string[];
  protected headStates: string[];

  constructor(options?: Partial<BBOptions>) {
    super({
      ...BBOptionsDefault,
      ...options,
    });

    this.rules = this.options.rules;

    const ruleKeys = Object.keys(this.rules);

    this.headStates = this.options.headStates || ruleKeys.map(k => k[0]).filter((v, i, a) => a.indexOf(v) === i);
    this.tapeStates = this.options.tapeStates || ruleKeys.map(k => k[1]).filter((v, i, a) => a.indexOf(v) === i);

    this.headStates.push('H');

    const headStates = [];
    const tapeStates = [];

    this.tapeStates.forEach((t, j) => {
      tapeStates.unshift(createState(t, String(j), " "));
      this.headStates.forEach((h, i) => {
        h = h.toUpperCase();
        headStates.push(createState(h + t, String.fromCharCode(65 + i + j*this.headStates.length), h));
      });
    });

    this.pallet = [tapeStates, [headStates[0]]];
    this.states = [...tapeStates.slice(0, -1), ...headStates, tapeStates[tapeStates.length - 1]];

    this.rules = this.options.rules;
  }

  // 2-state busy beaver
  getNextCell(x: number, y: number) {
    if (y !== this.stats.Step + 1) return; // Optimization for turning machines

    const c = this.getCell(x, y);

    if (c === this.emptyCell) {
      const up = this.getCell(x, y - 1);

      if (isHead(up)) {
        const rule = this.rules?.[up.state];
        if (rule) {
          const write = String(this.rules[up.state][0]);
          return this.states.find((s) => s.state === write);
        }
      }

      const up_right = this.getCell(x + 1, y - 1);
      if (isHead(up_right)) {
        const next = this.rules[up_right.state];
        if (next?.[1] === "L") {
          return this.findState(next[2] + this.getTapeState(up));
        }
        return up;
      }

      const up_left = this.getCell(x - 1, y - 1);
      if (isHead(up_left)) {
        const next = this.rules[up_left.state];
        if (next?.[1] === "R") {
          return this.findState(next[2] + this.getTapeState(up));
        }
        return up;
      }

      return up;
    }

    return c;
  }

  findState(state: string) {
    return this.states.find((s) => s.state === state);
  }

  getTapeState(c: CellState): string {
    return c.state[c.state.length - 1];
  }
}

function isHead(c: CellState): boolean {
  return c.state.length > 1;
}

// TODO: Abstract the rules
// TODO: Add Σ and S to stats
