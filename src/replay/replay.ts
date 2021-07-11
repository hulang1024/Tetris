import { Action } from "../action";

export class ReplayFrame {
  frame: number;
  action: Action;

  constructor(frame: number, action: Action) {
    this.frame = frame;
    this.action = action;
  }
}

export class Replay {
  level: number;
  prngSeed: string;
  frames: ReplayFrame[] = [];
  endFrame: number;
}