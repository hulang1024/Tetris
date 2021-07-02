import { Action } from "../action";

export class ReplayFrame {
  time: number;
  action: Action;

  constructor(time: number, action: Action) {
    this.time = time;
    this.action = action;
  }
}

export class Replay {
  prngSeed: string;
  frames: ReplayFrame[] = [];
}