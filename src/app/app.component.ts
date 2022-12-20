import { Component } from "@angular/core";

import { WireWorld } from "./games/wireworld";
import { Ant } from "./games/ant";
import { Life } from "./games/life";
import { Wolfram } from "./games/wolfram";
import { City } from "./games/city";

const Games = {
  life: { title: "Conway's Life", create: () => new Life() },
  ant: { title: "Langton's Ant", create: () => new Ant() },
  wireWorld: { title: "WireWorld", create: () => new WireWorld() },
  rule30: { title: "Rule 30", create: () => new Wolfram() },
  rule28: { title: "Rule 28", create: () => new Wolfram(28) },
  // city: { title: 'City', create: () => new City },
};

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  readonly Games = Games;

  playing = false;
  currentGame = "ant";
  game = this.Games[this.currentGame].create();
  currentType = this.game.states[0];

  private timeout = null;
  private speed = 100;

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
      this.game.dangerouslySetCell(j, i, this.currentType);
      this.game.doStats();
    }
  }

  doStep() {
    this.timeout = null;
    this.game.doStep();
    this.game.doStats();

    if (this.playing) {
      this.timeout = setTimeout(() => {
        this.doStep();
      }, this.speed);
    }
  }

  stop() {
    clearTimeout(this.timeout);
    this.timeout = null;
    this.playing = false;
  }
}
