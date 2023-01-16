import { ACTIVE, EMPTY, CA, CAOptions, BoundaryType } from '../classes/base';

interface BlockCAOptions extends CAOptions {
  ruleString: string;
}

const VoteDefaultOptions: BlockCAOptions = {
  width: 40,
  height: 40,
  boundaryType: BoundaryType.Torus,
  ruleString: 'MS,D15;1;2;3;4;5;6;7;8; 9;10;11;12;13;14;0'
};

export class BlockCA extends CA {
  stats: Record<string, any> = {
    Alive: 0,
  };

  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

  protected options: BlockCAOptions;
  protected rule: number[];

  constructor(options?: Partial<BlockCAOptions>) {
    super({
      ...VoteDefaultOptions,
      ...options,
    });

    this.rule = this.options.ruleString
      .replace(/ /g, '')
      .replace(/^MS,D/, '')
      .split(';')
      .map(Number);
  }

  doStep() {
    this.changedGrid.clear();

    const dx = this.step % 2;
    const dy = this.step % 2;

    for (let x = 0; x < this.width; x += 2) {
      for (let y = 0; y < this.height; y += 2) {
        this.doNeighborhood(x + dx, y + dy);
      }
    }

    this.currentGrid.assign(this.changedGrid);
    this.step++;
  }

  // Margolus neighborhood
  doNeighborhood(x: number, y: number) {
    let nw = this.get(x, y) === ACTIVE ? 1 : 0;
    let ne = this.get(x + 1, y) === ACTIVE ? 1 : 0;
    let sw = this.get(x, y + 1) === ACTIVE ? 1 : 0;
    let se = this.get(x + 1, y + 1) === ACTIVE ? 1 : 0;

    const sum = nw + ne*2 + sw*4 + se*8;
    const newState = this.rule[sum];

    nw = newState & 1;
    ne = newState & 2;
    sw = newState & 4;
    se = newState & 8;

    this.set(x, y, nw ? ACTIVE : EMPTY);
    this.set(x + 1, y, ne ? ACTIVE : EMPTY);
    this.set(x, y + 1, sw ? ACTIVE : EMPTY);
    this.set(x + 1, y + 1, se ? ACTIVE : EMPTY);
  }
}
