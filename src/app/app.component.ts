import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewEncapsulation,
} from "@angular/core";

import { WireWorld } from "./games/wireworld";
import { Ant } from "./games/ant";
import { Life } from "./games/life";
import { startingGrid, Wolfram } from "./games/wolfram";
import { CellState, Game, makeGridWith } from "./games/game";
import { KeyValue } from "@angular/common";
// import { City } from "./games/city";

/* Defining the interface for the pattern. */
interface GameListItem {
  title: string;
  create: () => Game;
  patterns: Array<CellState[][]>;
}

const Games: Record<string, GameListItem> = {
  life: { title: "Conway's Life", create: () => new Life(), patterns: [] },
  historyLife: {
    title: "Conway's Life (History)",
    create: () => new Life(),
    patterns: [],
  },
  torusLife: {
    title: "Conway's Life (Torus)",
    create: () => new Life({ continuous: true }),
    patterns: [],
  },
  ant: {
    title: "Langton's Ant",
    create: () => new Ant({ sizeX: 21, sizeY: 21 }),
    patterns: [],
  },
  torusAnt: {
    title: "Langton's Ant (Torus)",
    create: () => new Ant({ sizeX: 21, sizeY: 21, continuous: true }),
    patterns: [],
  },
  wireWorld: {
    title: "WireWorld",
    create: () => new WireWorld(),
    patterns: [],
  },
  rule30: { title: "Rule 30", create: () => new Wolfram(), patterns: [] },
  rule110: { title: "Rule 110", create: () => new Wolfram(110), patterns: [] },
  // city: { title: 'City', create: () => new City, patterns: [] },
};

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly Games = Games;

  playing = false;
  currentGame = "life";
  gameItem: GameListItem;
  game: Game;
  currentType: CellState;
  speed = -2;
  rle: string;

  private timeout = null;
  mouseDown = false;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.setupGame('life');
  }

  onGameChange(e: Event) {
    this.stop();
    this.setupGame((e.target as HTMLSelectElement).value);
  }

  onTogglePlay() {
    this.playing = !this.playing;
    if (this.playing && !this.timeout) {
      this.doStep();
    } else {
      this.stop();
    }
  }

  onReset() {
    this.resetGame();
  }

  onRandom() {
    this.game.fillWith(() => {
      const i = Math.floor(Math.random() * this.game.pallet.length);
      return this.game.pallet[i];
    });
  }

  onMouseLeave() {
    if (this.playing) {
      this.doStep();
    }
  }

  onMouseEnter(e: MouseEvent, j: number, i: number) {
    if (e.buttons) {
      const s =
        e.buttons === 1
          ? this.currentType
          : this.game.pallet[this.game.pallet.length - 1];

      const c = this.game.getCell(j, i);
      if (c !== s) {
        this.game.immediatelySetCell(j, i, s);
        this.game.refreshStats();
        this.rle = this.game.getRLE();
      }

      if (this.playing) {
        this.pause();
        this.onMouseEnter(e, j, i);
      }
    }
  }

  setupGame(name: string) {
    this.gameItem = this.Games[name];
    this.resetGame();
    this.gameItem.patterns[0] = this.game.getGridClone();
    this.currentType = this.game.pallet[0];
  }

  resetGame() {
    this.stop();
    this.game = this.gameItem.create();
    this.game.reset();
  }

  doStep() {
    this.timeout = null;

    if (this.speed > 0) {
      for (let i = 0; i <= this.speed; i++) {
        this.game.doStep();
      }
    } else {
      this.game.doStep();
    }

    this.rle = this.game.getRLE();
    this.cdr.detectChanges();

    if (this.playing) {
      const ms = Math.max(0, -this.speed * 100);
      this.timeout = setTimeout(() => {
        this.doStep();
      }, ms);
    }
  }

  stop() {
    clearTimeout(this.timeout);
    this.timeout = null;
    this.playing = false;
  }

  pause() {
    clearTimeout(this.timeout);
    this.timeout = null;
  }

  trackByMethod(index: number): number {
    return index;
  }

  titleAscOrder(
    a: KeyValue<string, GameListItem>,
    b: KeyValue<string, GameListItem>
  ): number {
    return a.value.title.localeCompare(b.value.title);
  };

  onAddPattern() {
    this.gameItem.patterns.push(this.game.getGridClone());
  }

  onUsePattern(g: CellState[][]) {
    this.game.setGrid(g);
  }
}
