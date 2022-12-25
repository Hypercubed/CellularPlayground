import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewEncapsulation,
} from "@angular/core";

import { WireWorld } from "./games/wireworld";
import { Ant } from "./games/ant";
import { Life } from "./games/life";
import { Wolfram } from "./games/wolfram";
import { Game } from "./games/game";
import { KeyValue } from "@angular/common";
// import { City } from "./games/city";

/* Defining the interface for the pattern. */
// interface Pattern {
//   name: string;
//   rle: string;
// }

interface GameListItem {
  title: string;
  create: () => Game;
  // TODO: support RLE patterns
  // patterns: Record<string, Pattern>;
}

const Games: Record<string, GameListItem> = {
  life: { title: "Conway's Life", create: () => new Life() },
  historyLife: { title: "Conway's Life (History)", create: () => new Life() },
  torusLife: { title: "Conway's Life (Torus)", create: () => new Life({ continuous: true }) },
  ant: { title: "Langton's Ant", create: () => new Ant({ sizeX: 41, sizeY: 41 }) },
  torusAnt: { title: "Langton's Ant (Torus)", create: () => new Ant({ sizeX: 21, sizeY: 21, continuous: true }) },
  wireWorld: { title: "WireWorld", create: () => new WireWorld() },
  rule30: { title: "Rule 30", create: () => new Wolfram() },
  rule110: { title: "Rule 110", create: () => new Wolfram(110) },
  // city: { title: 'City', create: () => new City },
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
  game = this.Games[this.currentGame].create();
  currentType = this.game.states[0];
  speed = -2;
  rle: string;

  private timeout = null;
  mouseDown = false;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.game = this.Games[this.currentGame].create();
    this.game.reset();
    this.currentType = this.game.states[0];
  }

  onGameChange(e: Event) {
    this.stop();

    this.currentGame = (e.target as HTMLSelectElement).value;
    this.game = this.Games[this.currentGame].create();
    this.game.reset();
    this.currentType = this.game.states[0];
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
    this.game.reset();
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
      const s = e.buttons === 1 ? this.currentType : this.game.pallet[this.game.pallet.length - 1];

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

  titleAscOrder = (a: KeyValue<string, GameListItem>, b: KeyValue<string, GameListItem>): number => {
    return a.value.title.localeCompare(b.value.title);
  }
}
