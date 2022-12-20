import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  NgZone,
  ViewEncapsulation,
} from "@angular/core";

import { WireWorld } from "./games/wireworld";
import { Ant } from "./games/ant";
import { Life } from "./games/life";
import { Wolfram } from "./games/wolfram";
// import { City } from "./games/city";

const Games = {
  life: { title: "Conway's Life", create: () => new Life() },
  ant: { title: "Langton's Ant", create: () => new Ant() },
  wireWorld: { title: "WireWorld", create: () => new WireWorld() },
  rule30: { title: "Rule 30", create: () => new Wolfram() },
  rule150: { title: "Rule 150", create: () => new Wolfram(150) },
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
  currentGame = "ant";
  game = this.Games[this.currentGame].create();
  currentType = this.game.states[0];
  speed = -2;

  private timeout = null;

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
    // this.game.grid = Array.from({ length: this.game.size }, () =>
    //   Array.from({ length: this.game.size }).map((_) => this.game.randomState())
    // );
  }

  onMouseEnter(e: MouseEvent, j: number, i: number) {
    if (e.buttons) {
      this.game.immediatelySetCell(j, i, this.currentType);
      this.game.refreshStats();
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

    this.cdr.detectChanges();

    if (this.playing) {
      const ms = Math.max(0, -this.speed * 200);
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
}
