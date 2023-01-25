import { WireWorld } from './constructors/wireworld';
import { Ant } from './constructors/ant';
import { Life } from './constructors/life';
import { ECA } from './constructors/wolfram';
import { BB } from './constructors/bb';
import { Rain } from './constructors/rain';
import { Vote } from './constructors/vote';
import { Dendrite } from './constructors/dendrite';
import { Brain } from './constructors/brain';
import { BlockCA } from './constructors/block';
import { WaTor } from './constructors/wa-tor';

import type { CA, CAOptions } from './classes/base';
import type { CellState } from './classes/states';

export interface CAStatic<
  T extends CellState = CellState,
  O extends CAOptions = CAOptions
> {
  new (options: Partial<O>): CA<T, O>;
  title: string;
  options?: O[];
  patterns?: string[];
  startingPattern?: string;
  className: string;
}

export const CAList: Array<CAStatic<any, any>> = [
  Life,
  Vote,
  Dendrite,
  Brain,
  Ant,
  WireWorld,
  ECA,
  Rain,
  BB,
  BlockCA,
  WaTor,
];
