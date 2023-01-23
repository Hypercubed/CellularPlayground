import { BoundaryType } from './classes/base';

import { Diodes, WireWorld } from './constructors/wireworld';
import { Ant } from './constructors/ant';
import {
  Life,
  Glider,
  GosperGliderGun,
  StillsAndOscillators,
} from './constructors/life';
import { ECA } from './constructors/wolfram';
import { BB, bb2, bb3, bb4, bb5 } from './constructors/bb';
import { Rain } from './constructors/rain';
import { OSCILLATOR, Vote } from './constructors/vote';
import { Dendrite } from './constructors/dendrite';
import { Brain, BRIAN_OSCILLATOR } from './constructors/brain';
import { BlockCA } from './constructors/block';
import { WaTor } from './constructors/wa-tor';

export interface CAListItem {
  title: string;
  Ctor: any;
  options?: any;
  patterns: string[];
  savedPatterns: string[];
  startingPattern?: string;
  class: string;
}

export const CAList: CAListItem[] = [
  {
    title: 'Life',
    Ctor: Life,
    options: [
      {
        title: "Conway's Life",
        ruleString: 'S23/B3',
        boundaryType: BoundaryType.Infinite,
      },
      {
        title: 'Torus',
        ruleString: 'S23/B3',
        boundaryType: BoundaryType.Torus,
      },
      { title: 'Diamoeba', ruleString: 'S5678/B35678' },
      { title: 'Maze', ruleString: 'S12345/B3' },
      { title: 'Day & Night', ruleString: 'S34678/B3678' },
      { title: 'HighLife', ruleString: 'S23/B36' },
      { title: 'Assimilation', ruleString: 'S4567/B345' },
      { title: 'Coagulations', ruleString: 'B378/S235678' },
      { title: 'Coral', ruleString: 'S45678/B3' },
      { title: 'Replicator', ruleString: 'B1357/S1357' },
      { title: 'Serviettes', ruleString: 'B234/S' },
      { title: 'Walled Cities', ruleString: 'B45678/S2345' },
      { title: 'AntiLife', ruleString: 'B0123478/S01234678' },
    ],
    patterns: [Glider, StillsAndOscillators, GosperGliderGun],
    savedPatterns: [],
    class: 'life',
  },
  {
    title: 'Vote',
    Ctor: Vote,
    options: [
      { title: 'Majority' },
      { title: 'Anneal', ruleString: '46789' },
      { title: 'Fredkin', ruleString: '13579' },
    ],
    patterns: [OSCILLATOR],
    savedPatterns: [],
    class: 'vote',
  },
  {
    title: 'Dendrite',
    Ctor: Dendrite,
    options: [],
    patterns: [],
    savedPatterns: [],
    class: 'dendrite',
  },
  {
    title: 'Brain',
    Ctor: Brain,
    options: [],
    patterns: [BRIAN_OSCILLATOR],
    savedPatterns: [],
    class: 'brain',
  },
  {
    title: "Langton's Ant",
    Ctor: Ant,
    options: [
      { title: 'Default' },
      {
        title: 'Torus',
        boundaryType: BoundaryType.Torus,
        width: 39,
        height: 39,
      },
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
    title: 'Wolfram',
    Ctor: ECA,
    options: [
      { title: 'Rule 30', ruleNumber: 30 },
      { title: 'Rule 90', ruleNumber: 90 },
      // { title: 'Rule 73', ruleNumber: 73 },
      // { title: 'Rule 74', ruleNumber: 74 },
      { title: 'Rule 110', ruleNumber: 110 },
    ],
    patterns: [],
    savedPatterns: [],
    startingPattern: 'o',
    class: 'wolfram',
  },
  {
    title: 'Snow',
    Ctor: Rain,
    options: [],
    patterns: [],
    savedPatterns: [],
    class: 'snow',
  },
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
      {
        title: '5-state busy beaver',
        height: 59,
        width: 59,
        rules: bb5,
        BoundaryType: BoundaryType.Infinite,
      },
    ],
    patterns: [],
    savedPatterns: [],
    startingPattern: 'A',
    class: 'busybeaver',
  },
  {
    title: 'BCA',
    Ctor: BlockCA,
    options: [
      {
        title: 'Tron',
        ruleString: 'MS,D15;1;2;3;4;5;6;7;8; 9;10;11;12;13;14;0',
      },
      {
        title: 'Billiard Ball Machine',
        ruleString: 'MS,D0;8;4;3;2;5;9;7; 1;6;10;11;12;13;14;15',
      },
      {
        title: 'Bounce Gas',
        ruleString: 'MS,D0;8;4;3;2;5;9;14; 1;6;10;13;12;11;7;15',
      },
      {
        title: 'HPP Gas',
        ruleString: 'MS,D0;8;4;12;2;10;9; 14;1;6;5;13;3;11;7;15',
      },
      {
        title: 'Critters',
        ruleString: 'MS,D15;14;13;3;11;5; 6;1;7;9;10;2;12;4;8;0',
      },
      {
        title: 'Sand',
        ruleString: 'MS,D0;4;8;12;4;12;12;13; 8;12;12;14;12;13;14;15',
        boundaryType: BoundaryType.Wall,
      },
      {
        title: 'Rotations',
        ruleString: 'MS,D0;2;8;12;1;10;9; 11;4;6;5;14;3;7;13;15',
      },
    ],
    patterns: [],
    savedPatterns: [],
    class: 'block',
  },
  // {
  //   title: 'Wa-Tor',
  //   Ctor: WaTor,
  //   options: [],
  //   patterns: [],
  //   savedPatterns: [],
  //   class: 'wator',
  // },
  {
    title: 'Wa-Tor',
    Ctor: WaTor,
    options: [
      { title: 'Sharks and Fish on the Planet Wa-Tor' },
      {
        title: 'Shrimp, Fish and Sharks',
        species: {
          shrimp: {
            energy: Infinity,
            fertility: 4,
          },
          fish: {
            energy: 3,
            fertility: 12,
            prey: 'shrimp',
          },
          shark: {
            energy: 12,
            fertility: 15,
            prey: 'fish',
          },
        },
      },
    ],
    patterns: [],
    savedPatterns: [],
    class: 'wator',
  },
];
