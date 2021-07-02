import { Block, typicalBlockDirTable } from "./block";
import { Game } from "./Game";
import { InputKey } from "./input/keys";
import { GameMap } from "./map";
import { TetrisWindow } from "./TetrisWindow";
import Bindable from "./utils/bindables/Bindable";
import BindableBool from "./utils/bindables/BindableBool";
import { BlockGenerator } from "./blockGenerator";
import { Action } from "./action";
import Gamepad, { GamepadButton } from "./gamepad";
import ReplayRecorder from "./replay/ReplayRecorder";
import { Replay, ReplayFrame } from "./replay/replay";

export class TetrisGame extends Game {
  isPause = new BindableBool(true);
  isOver = new BindableBool(true);
  isReplayMode = false;
  readonly gameMap = new GameMap(20, 10);
  currentBlock: Block;
  nextBlock = new Bindable<Block>();
  clearLineCount = new Bindable<number>(0);
  lineClearing = false;
  blockCount = 0;
  tetrisWindow = new TetrisWindow(this.gameMap, this.nextBlock, this.clearLineCount);
  blockGenerator: BlockGenerator;
  gamepad: Gamepad;

  gameStartTimestamp: number = 0;
  replayRecoder: ReplayRecorder = new ReplayRecorder();
  replay: Replay;
  replayNowFrameIndex: number = 0;

  constructor(blockGenerator: BlockGenerator) {
    super();
    this.blockGenerator = blockGenerator;

    const pauseOverlay = document.querySelector('.main .pause-overlay');
    this.isPause.addAndRunOnce((isPause) => {
      pauseOverlay.classList[isPause ? 'add' : 'remove']('show');
    });
    const overOverlay = document.querySelector('.main .over-overlay');
    this.isOver.changed.add((isOver: boolean) => {
      overOverlay.classList[isOver ? 'add' : 'remove']('show');
    });

    this.gamepad = new Gamepad({
      onPress: (button) => {
        let action = null;
        switch (button) {
          case GamepadButton.Up:
          case GamepadButton.Rotate:
            action = Action.Rotate;
            break;
          case GamepadButton.Down:
            action = Action.Down;
            break;
          case GamepadButton.Right:
            action = Action.Right;
            break;
          case GamepadButton.Left:
            action = Action.Left;
            break;
          case GamepadButton.Enter:
            action = Action.Enter;
            break;
        }
        if (action) {
          this.onAction(action)
        }
      }
    })
  }

  createBlock() {
    const type = this.blockGenerator.getBlockType(this.blockCount++);
    const dir = typicalBlockDirTable[type];
    return new Block(type, dir, -3, (this.gameMap.cols - 4) / 2, this.gameMap);
  }
  
  updateAccTime = 0;
  
  onUpdate(dt: number) {
    if (this.isOver.value || this.isPause.value) {
      return;
    }

    if (this.isReplayMode) {
      const { frames } = this.replay;
      const now = new Date().getTime();
      while (this.replayNowFrameIndex < frames.length) {
        const frame = frames[this.replayNowFrameIndex];
        if (now - this.gameStartTimestamp > frame.time) {
          this.onAction(frame.action);
          this.replayNowFrameIndex++;
        } else {
          break;
        }
      }
    }

    this.gamepad.onUpdate()

    this.updateAccTime += dt;
    if (this.updateAccTime * 1000 < 20 * 16.666) {
      return;
    }
    this.updateAccTime = 0;
  
    if (this.lineClearing) {
      return;
    }

    const { gameMap, currentBlock } = this;
    if (!currentBlock.fall()) {
      const canClearLine = gameMap.checkClearLine((count) => {
        this.lineClearing = true;
        this.clearLineCount.value += count;
      }, () => {
        this.lineClearing = false;
        if (this.isReplayEnd()) {
          this.gameOver();
        }
      });
      if (canClearLine || currentBlock.gridRow > 0) {
        this.currentBlock = this.nextBlock.value;
        gameMap.addBlock(this.currentBlock);
        this.nextBlock.value = this.createBlock();
      } else {
        this.gameOver();
      }
    } else {
      if (!this.isOver.value && this.isReplayEnd()) {
        this.gameOver();
      }
    }
  }

  restart() {
    this.gameMap.clear();
    this.lineClearing = false;
    this.clearLineCount.value = 0;
    this.blockCount = 0;

    if (this.isReplayMode) {
      this.blockGenerator.reset(this.replay.prngSeed);
      this.replayNowFrameIndex = 0;
    } else {
      this.blockGenerator.reset(new Date().getTime().toString());
      const replay = new Replay()
      replay.prngSeed = this.blockGenerator.seed
      this.replay = replay;
      this.replayRecoder.setReplay(replay)
    }

    this.currentBlock = this.createBlock();
    this.nextBlock.value = this.createBlock();
    this.gameMap.addBlock(this.currentBlock);

    this.gameStartTimestamp = new Date().getTime();

    this.isPause.value = false;
    this.isOver.value = false;
  }

  gameOver() {
    this.isOver.value = true;
    console.log(this.replayRecoder.replay);
  }

  isReplayEnd() {
    return this.isReplayMode && this.replayNowFrameIndex == this.replay.frames.length;
  }

  onAction(action: Action) {
    if ((this.isPause.value && action != Action.Enter) || this.lineClearing) {
      return;
    }
    const { currentBlock } = this;
    switch (action) {
      case Action.Rotate:
        currentBlock.rotate();
        break;
      case Action.Left:
        currentBlock.left(-1);
        break;
      case Action.Right:
        currentBlock.left(+1);
        break;
      case Action.Down:
        currentBlock.fall();
        break;
      case Action.Fall:
        while (currentBlock.fall());
        break;
      case Action.Enter:
        if (this.isOver.value) {
          this.restart();
        } else {
          this.isPause.toggle();
        }
        break;
    }

    if (!this.isReplayMode && action && action != Action.Enter) {
      this.replayRecoder.record(
        new ReplayFrame(new Date().getTime() - this.gameStartTimestamp, action));
    }
  }
  
  onKeyDown(key: InputKey) {
    let action = null;
    switch (key) {
      case InputKey.Up:
      case InputKey.W:
      case InputKey.J:
        action = Action.Rotate;
        break;
      case InputKey.Down:
      case InputKey.S:
        action = Action.Down;
        break;
      case InputKey.Right:
      case InputKey.D:
        action = Action.Right;
        break;
      case InputKey.Left:
      case InputKey.A:
        action = Action.Left;
        break;
      case InputKey.Enter:
        action = Action.Enter;
        break;
      case InputKey.Space:
        action = Action.Fall;
        break;
      case InputKey.R:
        this.isPause.value = true;
        this.isReplayMode = false;
        this.restart();
        break;
      // 调试回放用
      case InputKey.G:
        if (this.replay) {
          this.isPause.value = true;
          this.isReplayMode = true;
          console.log(this.replay)
          this.restart();
        } else {
          alert('还没有回放数据，请先游戏');
        }
        break;
    }
    if (action) {
      if (action != Action.Enter && this.isReplayMode) {
        return;
      }
      this.onAction(action)
    }
  }
}