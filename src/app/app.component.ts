import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";

import Stats from "stats.js";

import { MatSelectChange } from "@angular/material/select";

import { Diodes, WireWorld } from "./games/wireworld";
import { Ant } from "./games/ant";
import { Life } from "./games/life";
import { Wolfram } from "./games/wolfram";
import { CellState, Game, GameOptions } from "./games/game";
import { KeyValue } from "@angular/common";
import { Rain } from "./games/rain";
// import { City } from "./games/city";

/* Defining the interface for the pattern. */
interface GameListItem {
  title: string;
  Ctor: any;
  options?: any;
  patterns: string[];
  savedPatterns: Array<CellState[][]>;
  class?: string;
}

const Games: GameListItem[] = [
  {
    title: "Conway's Life",
    Ctor: Life,
    options: [
      { title: "Default", ruleString: "b3s23" },
      { title: "Torus", ruleString: "b3s23", continuous: true },
      { title: "Diamoeba", ruleString: "B35678/S5678" },
      { title: "Maze", ruleString: "B3/S12345" },
    ],
    patterns: [""],
    savedPatterns: [],
    class: "life",
  },
  {
    title: "Langton's Ant",
    Ctor: Ant,
    options: [
      { title: "Default", continuous: false },
      { title: "Torus", continuous: true },
    ],
    patterns: ["$$$$$$$$$$$$$$14b1▲"],
    savedPatterns: [],
    class: "ant",
  },
  {
    title: "WireWorld",
    Ctor: WireWorld,
    options: [],
    patterns: ["", Diodes],
    savedPatterns: [],
    class: "wireworld",
  },
  {
    title: "Wolfram Rules",
    Ctor: Wolfram,
    options: [
      { title: "Rule 30", N: 30 },
      { title: "Rule 90", N: 90 },
      { title: "Rule 110", N: 110 },
    ],
    patterns: ["21b1o"],
    savedPatterns: [],
    class: "wolfram",
  },
  {
    title: "Rain",
    Ctor: Rain,
    options: [
    ],
    patterns: [],
    savedPatterns: [],
    class: "rain",
  },
];

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
  paused = false;

  gameItem: GameListItem;
  game: Game;
  gameOptions: GameOptions;

  currentType: CellState;
  speed = -2;
  rle: string;

  private timeout = null;
  private stats: Stats;

  @ViewChild("board", { static: true }) board: ElementRef;
  @ViewChild("stats", { static: true }) statElement: ElementRef;

  constructor(private readonly cdr: ChangeDetectorRef) {
    this.stats = new Stats();
  }

  ngOnInit() {
    this.setupGame(this.Games[0], this.Games[0].options[0]);

    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    this.statElement.nativeElement.appendChild(this.stats.dom);
  }

  onGameChange(e: MatSelectChange) {
    this.stop();
    this.setupGame(e.value);
  }

  onOptionsChange(e: MatSelectChange) {
    this.stop();
    this.setupGame(this.gameItem, e.value);
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
    if (this.playing && this.paused) {
      this.paused = false;
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

  setupGame(gameItem: GameListItem, gameOptions: GameOptions = gameItem.options[0]) {
    this.stop();

    this.gameItem = gameItem;
    this.resetGame(gameOptions);

    if (this.gameItem.patterns && !this.gameItem.savedPatterns.length) {
      this.gameItem.patterns.forEach((pattern: string) => {
        if (pattern) {
          this.gameItem.savedPatterns.push(this.game.rleToGrid(pattern));
        }
      });
    }
    this.currentType = this.game.defaultCell;
  }

  resetGame(gameOptions: GameOptions = this.gameItem.options[0]) {
    this.stop();

    this.gameOptions = gameOptions;
    const { Ctor } = this.gameItem;
    this.game = new Ctor(gameOptions);
    this.game.reset();

    if (this.gameItem.patterns && this.gameItem.patterns.length > 0) {
      const g = this.gameItem.patterns[0];
      const gg = this.game.rleToGrid(g)
      this.game.setGrid(gg);
    }
  }

  doStep() {
    this.timeout = null;

    this.stats.begin();

    if (this.speed > 0) {
      this.game.doSteps(this.speed, this.playing);
    } else {
      this.game.doSteps(1, this.playing);
    }

    this.cdr.detectChanges();
    this.stats.end();

    if (this.playing && !this.paused) {
      const next = () => {
        this.doStep();
      };

      if (this.speed < 0) {
        const ms = Math.max(0, -this.speed * 100);
        this.timeout = setTimeout(next, ms);
      } else {
        requestAnimationFrame(next);
      }
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
    this.paused = true;
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
    this.gameItem.savedPatterns.push(this.game.getGridClone());
  }

  onUsePattern(g: CellState[][]) {
    this.game.setGrid(g);
  }

  onRemovePattern(pattern: CellState[][]) {
    this.gameItem.savedPatterns = this.gameItem.savedPatterns.filter(
      (p) => p !== pattern
    );
  }
}
