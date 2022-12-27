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
    create: () => new Life('b2s23'),
    patterns: [],
  },
  torusLife: {
    title: "Conway's Life (Torus)",
    create: () => new Life('b2s23', { continuous: true }),
    patterns: [],
  },
  // starTrekLife: {
  //   title: "Star Trek",
  //   create: () => new Life('B3/S0248'),
  //   patterns: [],
  // },
  diamoebaLife: {
    title: "Diamoeba",
    create: () => new Life('B35678/S5678'),
    patterns: [],
  },
  mazeLife: {
    title: "Maze",
    create: () => new Life('B3/S12345'),
    patterns: [],
  },
  ant: {
    title: "Langton's Ant",
    create: () => new Ant(),
    patterns: [],
  },
  torusAnt: {
    title: "Langton's Ant (Torus)",
    create: () => new Ant({ continuous: true }),
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

  @ViewChild('board', { static: true }) board: ElementRef;

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

      const s =
        e.buttons === 1
          ? this.currentType
          : this.game.emptyCell;

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

    const x = Math.floor(dx / el.clientWidth * this.game.sizeX);
    const y = Math.floor(dy / el.clientHeight * this.game.sizeY);

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
    // console.log(this.game.getRLE());
    if (!/^\$+$/.test(this.game.getRLE())) {
      this.gameItem.patterns[0] = this.game.getGridClone();
    }
    this.currentType = this.game.defaultCell;
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
  }

  onUsePattern(g: CellState[][]) {
    this.game.setGrid(g);
  }
}
