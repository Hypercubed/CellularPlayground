import { BoundaryType } from './game';

import { Diodes, WireWorld } from './constructors/wireworld';
import { Ant } from './constructors/ant';
import { Life, Glider, GosperGliderGun, StillsAndOscillators } from './constructors/life';
import { Wolfram } from './constructors/wolfram';
import { BB, bb2, bb3, bb4, bb5 } from './constructors/bb';

export interface GameListItem {
  title: string;
  Ctor: any;
  options?: any;
  patterns: string[];
  savedPatterns: string[];
  startingPattern?: string;
  class: string;
}

export const Games: GameListItem[] = [
  {
    title: "Conway's Life",
    Ctor: Life,
    options: [
      {
        title: 'Default',
        ruleString: 'S23/B3',
        boundaryType: BoundaryType.Infinite,
      },
      { title: 'Torus', ruleString: 'S23/B3', boundaryType: BoundaryType.Torus },
      { title: 'Diamoeba', ruleString: 'S5678/B35678' },
      { title: 'Maze', ruleString: 'S12345/B3' },
    ],
    patterns: [Glider, StillsAndOscillators, GosperGliderGun],
    savedPatterns: [],
    class: 'life',
  },
  {
    title: "Langton's Ant",
    Ctor: Ant,
    options: [
      { title: 'Default' },
      { title: 'Torus', boundaryType: BoundaryType.Torus },
    ],
    startingPattern: '▲',
    patterns: [],
    savedPatterns: [],
    class: 'ant',
  },
  {
    title: 'WireWorld',
    Ctor: WireWorld,
    options: [],
    patterns: [Diodes],
    savedPatterns: [],
    class: 'wireworld',
  },
  {
    title: 'Wolfram Rules',
    Ctor: Wolfram,
    options: [
      { title: 'Rule 30', ruleNumber: 30 },
      { title: 'Rule 90', ruleNumber: 90 },
      { title: 'Rule 110', ruleNumber: 110 },
    ],
    patterns: [],
    savedPatterns: [],
    startingPattern: 'o',
    class: 'wolfram',
  },
  // {
  //   title: "Snow",
  //   Ctor: Rain,
  //   options: [
  //   ],
  //   patterns: [],
  //   savedPatterns: [],
  //   class: "snow",
  // },
  {
    title: 'Busy Beaver',
    Ctor: BB,
    options: [
      {
        title: '2-state busy beaver',
        BoundaryType: BoundaryType.Wall,
        rules: bb2,
      },
      {
        title: '3-state busy beaver',
        rules: bb3,
        BoundaryType: BoundaryType.Wall,
      },
      {
        title: '4-state busy beaver',
        height: 120,
        rules: bb4,
        BoundaryType: BoundaryType.Wall,
      },
      { title: '5-state busy beaver', height: 59, width: 59, rules: bb5, BoundaryType: BoundaryType.Infinite },
    ],
    patterns: [],
    savedPatterns: [],
    startingPattern: 'A',
    class: 'busybeaver',
  }
];