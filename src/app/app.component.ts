import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";

import { WireWorld } from "./games/wireworld";
import { Ant } from "./games/ant";
import { Life } from "./games/life";
import { Wolfram } from "./games/wolfram";
import { CellState, Game, makeGridWith } from "./games/game";
import { KeyValue } from "@angular/common";
// import { City } from "./games/city";

/* Defining the interface for the pattern. */
interface GameListItem {
  title: string;
  // create: () => Game;
  Ctor: any;
  options: any;
  patterns: Array<CellState[][]>;
}

const Games: Record<string, GameListItem> = {
  life: {
    title: "Conway's Life",
    Ctor: Life,
    options: {},
    // create: () => new Life(),
    patterns: [],
  },
  historyLife: {
    title: "Conway's Life (History)",
    Ctor: Life,
    options: { ruleString: "b2s23" },
    patterns: [],
  },
  torusLife: {
    title: "Conway's Life (Torus)",
    Ctor: Life,
    options: { ruleString: "b2s23", continuous: true },
    patterns: [],
  },
  // starTrekLife: {
  //   title: "Star Trek",
  //   create: () => new Life({ ruleString: 'B3/S0248' }),
  //   patterns: [],
  // },
  diamoebaLife: {
    title: "Diamoeba",
    Ctor: Life,
    options: { ruleString: "B35678/S5678" },
    patterns: [],
  },
  mazeLife: {
    title: "Maze",
    Ctor: Life,
    options: { ruleString: "B3/S12345" },
    patterns: [],
  },
  ant: {
    title: "Langton's Ant",
    Ctor: Ant,
    options: {},
    patterns: [],
  },
  torusAnt: {
    title: "Langton's Ant (Torus)",
    Ctor: Ant,
    options: { continuous: true },
    patterns: [],
  },
  wireWorld: {
    title: "WireWorld",
    Ctor: WireWorld,
    options: {},
    patterns: [],
  },
  rule30: {
    title: "Rule 30",
    Ctor: Wolfram,
    options: { N: 30 },
    patterns: [],
  },
  rule110: {
    title: "Rule 110",
    Ctor: Wolfram,
    options: { N: 110 },
    patterns: [],
  },
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

  @ViewChild("board", { static: true }) board: ElementRef;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.setupGame("life");
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

  onClear() {
    this.game.fillWith(() => this.game.emptyCell);
  }

  onRandom() {
    this.game.fillWith(() => {
      const i = Math.floor(Math.random() * this.game.states.length);
      return this.game.states[i];
    });
  }

  onMouseLeave() {
    if (this.playing) {
      this.doStep();
    }
  }

  onMouseEnter(e: MouseEvent, x: number, y: number) {
    if (e.buttons) {
      if (this.playing) {
        this.pause();
      }

      const s = e.buttons === 1 ? this.currentType : this.game.emptyCell;

      this.setCell(x, y, s);
    }
  }

  onClick(e: MouseEvent, x: number, y: number) {
    e.preventDefault();
    e.stopPropagation();

    this.setCell(x, y, this.currentType);
  }

  onTouch(e: TouchEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (this.playing) {
      this.pause();
    }

    const el = this.board.nativeElement;

    const dx = e.touches[0].clientX - el.offsetLeft;
    const dy = e.touches[0].clientY - el.offsetTop;

    const x = Math.floor((dx / el.clientWidth) * this.game.width);
    const y = Math.floor((dy / el.clientHeight) * this.game.height);

    this.setCell(x, y, this.currentType);
  }

  setCell(x: number, y: number, s: CellState) {
    const c = this.game.getCell(x, y);
    if (c !== s) {
      this.game.immediatelySetCell(x, y, s);
      this.game.refreshStats();
    }
  }

  setupGame(name: string) {
    this.gameItem = this.Games[name];
    this.resetGame();
    if (this.game.patterns && !this.gameItem.patterns.length) {
      this.game.patterns.forEach((pattern: string) => {
        if (pattern) {
          this.gameItem.patterns.push(this.game.rleToGrid(pattern));
        }
      });
    }
    this.currentType = this.game.defaultCell;
  }

  resetGame() {
    this.stop();
    const { Ctor, options } = this.gameItem;
    this.game = new Ctor(options);
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

    // console.log(this.game.getRLE());
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
  }

  onAddPattern() {
    this.gameItem.patterns.push(this.game.getGridClone());
    console.log(this.game.getRLE());
  }

  onUsePattern(g: CellState[][]) {
    this.game.setGrid(g);
  }
}
