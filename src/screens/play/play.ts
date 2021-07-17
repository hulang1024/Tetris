import { Block } from "./block";
import { GameMap } from "./map";
import { TetrisWindow } from "./TetrisWindow";
import { BlockGenerator } from "./blockGenerator";
import { Action } from "./blockAction";
import { levelLinesTable, levelSpeedTable } from "./level";
import KeyboardState from "../../input/KeyboardState";
import KeyboardHandler from "../../input/KeyboardHandler";
import * as delay from "../../input/delay";
import TetrisGamepad, { TetrisGamepadButton } from "../../input/tetrisGamepad";
import Bindable from "../../utils/bindables/Bindable";
import { ScoreProcessor } from "../../scoring/ScoreProcessor";
import { Replay, ReplayFrame } from "../../replay/replay";
import ReplayRecorder from "../../replay/ReplayRecorder";
import { InputKey } from "../../input/keys";
import { KeyBindingManager } from "../../input/bindings/keyBindings";
import AudioManager from "../../audio/AudioManager";
import { GameplayAudio } from "./gameplayAudio";
import { GameOverOverlay } from "./gameOverOverlay";
import { GameReadyOverlay } from "./gameReadyOverlay";
import { GamePauseOverlay } from "./gamePauseOverlay";
import BindableList from "../../utils/bindables/BindableList";

enum GameState {
  NotStarted,
  Playing,
  Paused,
  End
}

const gameKeyboardInputKeys = [
  InputKey.Up, InputKey.W, InputKey.J,
  InputKey.Down, InputKey.S,
  InputKey.Right, InputKey.D,
  InputKey.Left, InputKey.A,
];

export class TetrisGame {
  keyboardState: KeyboardState = new KeyboardState();
  gamepad: TetrisGamepad;
  keyBindingManager: KeyBindingManager = new KeyBindingManager();
  audioManager: AudioManager = new AudioManager();
  gameplayAudio: GameplayAudio = new GameplayAudio(this.audioManager);

  gameState = new Bindable<GameState>(GameState.NotStarted);

  gameMap: GameMap;
  currentBlock = new Bindable<Block>();
  nextBlockQueue = new BindableList<Block>();
  shadowBlock: Block;
  blockCount = 0;
  tetrisWindow: TetrisWindow;
  blockGenerator: BlockGenerator;

  level = new Bindable<number>(0);
  levelSpeedFrames: number;
  levelLines: number;
  scoreProcessor: ScoreProcessor = new ScoreProcessor();
  isLineClearing = false;
  isHardDropping = false;
  isLockDelayTime = false;
  lockDelay = 0;
  dropAccFrames = 0;

  isReplayMode = false;
  replayRecoder: ReplayRecorder = new ReplayRecorder();
  replayRecordFrameIndex: number = 0;
  replay: Replay;
  replayFrameIndex: number = 0;

  inputAction: Action;
  actionLastRepeatTimeMap: Map<Action, number> = new Map();

  constructor() {
    this.blockGenerator = new BlockGenerator(new Date().getTime().toString());
    const mapHeight = document.body.offsetHeight - (window.device.mobile() ? 166 : 0) - 16;
    this.gameMap = new GameMap(20, 10, Math.min(28, Math.floor(mapHeight / 20)));
    this.tetrisWindow = new TetrisWindow(
      this.gameMap, this.nextBlockQueue, this.level, this.scoreProcessor);

    const gameOverOverlay = new GameOverOverlay();
    gameOverOverlay.onRestart = () => {
      this.isReplayMode = false;
      this.restart();
    };
    gameOverOverlay.onWatchReplay = () => {
      this.isReplayMode = true;
      this.restart();
    };
    this.gameMap.el.appendChild(gameOverOverlay.el);

    const gameReadyOverlay = new GameReadyOverlay();
    gameReadyOverlay.onStart = () => {
      this.onAction(Action.Enter);
    };
    this.gameMap.el.appendChild(gameReadyOverlay.el);

    const gamePauseOverlay = new GamePauseOverlay();
    gamePauseOverlay.onResume = () => {
      this.gameState.value = GameState.Playing;
    };
    gamePauseOverlay.onRestart = () => {
      this.restart();
    };
    gamePauseOverlay.onQuit = () => {
      this.gameOver();
    };
    this.gameMap.el.appendChild(gamePauseOverlay.el);

    const toggle = (el: HTMLElement, isShow?: boolean) => {
      el.classList[isShow ? 'add' : 'remove']('show');
    }
    this.gameState.addAndRunOnce((gameState: GameState) => {
      document.querySelector('.main').classList[
        gameState == GameState.Playing ? 'add' : 'remove'
      ]('playing');

      toggle(gameReadyOverlay.el, gameState == GameState.NotStarted);
      toggle(gamePauseOverlay.el, gameState == GameState.Paused);
      toggle(gameOverOverlay.el, gameState == GameState.End);
    });

    this.level.addAndRunOnce((level: number) => {
      this.levelLines = 0;
      this.levelSpeedFrames = levelSpeedTable[level];
    });

    this.shadowBlock = new Block(-1, -1, -4, 0, this.gameMap);
    this.gameMap.addBlock(this.shadowBlock);

    this.currentBlock.addAndRunOnce((block) => {
      if (!block || !block.canFall()) {
        return;
      }
      this.gameMap.addBlock(block);

      this.shadowBlock.type = block.type;
      this.shadowBlock.dir = -1;
      this.shadowBlock.show();
    });

    new KeyboardHandler({
      onKeyDown: (key, event) => {
        if (event.repeat) {
          return;
        }
        this.onKeyDown(key, event);
        this.keyboardState.keys.setPressed(key, true);
      },
      onKeyUp: (key, event) => {
        if (event.repeat) {
          return;
        }
        this.onKeyUp(key, event);
        this.keyboardState.keys.setPressed(key, false);
      },
    });

    this.gamepad = !window.device.mobile() ? null : new TetrisGamepad({
      onPress: (button: TetrisGamepadButton) => {
        let action = null;
        switch (button) {
          case TetrisGamepadButton.Up:
            action = Action.HardDrop;
            break;
          case TetrisGamepadButton.Rotate:
            action = Action.Rotate;
            break;
          case TetrisGamepadButton.Down:
            action = Action.Down;
            break;
          case TetrisGamepadButton.Right:
            action = Action.Right;
            break;
          case TetrisGamepadButton.Left:
            action = Action.Left;
            break;
          case TetrisGamepadButton.Enter:
            action = Action.Enter;
            break;
        }
        if (action) {
          this.onAction(action);
        }
      }
    });

    this.setupUpdateLoop();
  }
  
  onUpdate(dt: number) {
    gameKeyboardInputKeys.forEach((key) => {
      if (this.keyboardState.keys.isPressed(key)
        && this.keyboardState.keys.getPressDuration(key) > delay.DAS) {
        this.onAction(this.keyBindingManager.getActionByKey(key));
      }
    });
    this.gamepad?.onUpdate();

    if (this.gameState.value != GameState.Playing) {
      return;
    }

    if (this.isLineClearing) {
      return;
    }

    if (this.isReplayMode) {
      const { frames } = this.replay;
      if (this.replayFrameIndex < frames.length) {
        const replayFrame = frames[this.replayFrameIndex];
        if (this.replayRecordFrameIndex === replayFrame.frame) {
          this.inputAction = replayFrame.action;
          this.replayFrameIndex++;
        }
      } else if (this.replayRecordFrameIndex >= this.replay.endFrame) {
        this.gameOver();
        return;
      }
    }

    let isSoftDrop = false;

    if (!this.isHardDropping && this.inputAction) {
      isSoftDrop = this.inputAction == Action.Down;
      this.doBlockAction(this.inputAction);
      this.inputAction = null;
    }

    this.updateShadowBlock();

    this.replayRecordFrameIndex++;

    const currentBlock = this.currentBlock.value;

    let isLocked = false;
    if (this.isHardDropping) {
      this.dropAccFrames = 0;
      currentBlock.hardDrop();
      this.shadowBlock.hide();
      isLocked = true;
      this.cancelLockDelay();
    } if (isSoftDrop) {
      isLocked = !currentBlock.fall();
      if (isLocked) {
        this.shadowBlock.hide();
      }
      this.cancelLockDelay();
    } else {
      this.dropAccFrames++;
      if (this.dropAccFrames >= this.levelSpeedFrames) {
        this.dropAccFrames = 0;
        if (currentBlock.fall()) {
          if (!currentBlock.canFall()) {
            this.isLockDelayTime = true;
            this.resetLockDelayIfIsTime();
          }
        } else {
          this.shadowBlock.hide();
          if (!this.isLockDelayTime) {
            this.isLockDelayTime = true;
            this.resetLockDelayIfIsTime();
          }
        }
      }

      if (this.isLockDelayTime) {
        this.lockDelay--;

        if (this.lockDelay <= 0) {
          this.cancelLockDelay();
          isLocked = !currentBlock.canFall();
        }    
      }
    }

    if (isLocked) {
      this.shadowBlock.hide();
      currentBlock.lock();
      this.scoreProcessor.onBottom();
      const clearLines = this.gameMap.checkClearLine((lines) => {
        this.isLineClearing = true;
      }, (lines) => {
        if (lines) {
          this.scoreProcessor.onClearLines(lines);
          this.levelLines += lines;
          this.checkUpLevel();
        }
        this.isLineClearing = false;
        if (clearLines || currentBlock.gridRow > 0) {
          this.currentBlock.value = this.nextBlockQueue.shift();
          this.nextBlockQueue.add(this.createBlock());
        } else {
          this.gameOver();
        }
      });
      if (clearLines) {
        if (this.isHardDropping) {
          this.isHardDropping = false;
        }
        this.gameplayAudio.play(`erase${clearLines}`);
      } else {
        if (this.isHardDropping) {
          this.isHardDropping = false;
          this.gameplayAudio.play('harddrop');
        } else {
          this.gameplayAudio.play('lock');
        }
      }
      this.gameMap.el.style.setProperty('--g', `${(clearLines + 1) * 4}px`);
      this.gameMap.el.classList.add('g');
      this.gameMap.el.ontransitionend = () => {
        this.gameMap.el.classList.remove('g');
      };
    }
  }

  createBlock() {
    const blockType = this.blockGenerator.getBlockType(this.blockCount++);
    return new Block(
      blockType.type, blockType.dir,
      -3, (this.gameMap.cols - 4) / 2,
      this.gameMap
    );
  }

  updateShadowBlock(force = false) {
    const currentBlock = this.currentBlock.value;
    const { shadowBlock } = this;

    if (!(shadowBlock && shadowBlock.type > -1)) {
      return;
    }

    if (currentBlock.dir != shadowBlock.dir) {
      shadowBlock.dir = currentBlock.dir;
      force = true;
    }

    if (force || currentBlock.gridCol != shadowBlock.gridCol) {
      shadowBlock.gridRow = currentBlock.gridRow;
      shadowBlock.gridCol = currentBlock.gridCol;
      this.gameMap.easeBlockState(currentBlock);
      while (true) {
        if (shadowBlock.canFall()) {
          shadowBlock.gridRow++;
        } else {
          break;
        }
      }
      shadowBlock.setPosition(shadowBlock.gridRow, currentBlock.gridCol, true);
      this.gameMap.setBlockState(currentBlock);
    }
  }

  resetLockDelayIfIsTime() {
    this.lockDelay = 68 - this.levelSpeedFrames;
  }

  cancelLockDelay() {
    if (this.isLockDelayTime) {
      this.isLockDelayTime = false;
      this.lockDelay = 0;
    }
  }
  
  restart() {
    this.gameMap.clear();
    this.isLineClearing = false;
    this.isHardDropping = false;
    this.cancelLockDelay();
    this.dropAccFrames = 0;
    this.scoreProcessor.reset();
    this.blockCount = 0;

    this.inputAction = null;

    this.replayRecordFrameIndex = 0;

    if (this.isReplayMode) {
      this.replayFrameIndex = 0;
      this.level.value = this.replay.level;
      this.blockGenerator.reset(this.replay.prngSeed);
    } else {
      this.blockGenerator.reset(new Date().getTime().toString());
      const replay = new Replay()
      replay.prngSeed = this.blockGenerator.seed;
      this.replay = replay;
      this.replayRecoder.setReplay(replay);
      this.replay.level = this.level.value;
    }

    this.currentBlock.value = this.createBlock();

    this.nextBlockQueue.clear();
    for (let n = 0; n < 4; n++) {
      this.nextBlockQueue.add(this.createBlock());
    }

    this.gameState.value = GameState.Playing;

    this.gameplayAudio.play('go');
  }

  gameOver() {
    this.gameState.value = GameState.End;
    this.replay.endFrame = this.replayRecordFrameIndex;
  }

  checkUpLevel() {
    const diff = this.levelLines - levelLinesTable[this.level.value];
    if (diff < 0) {
      return;
    }

    this.level.value++;
  }

  onAction(action: Action) {
    if ((this.gameState.value == GameState.Paused && action != Action.Enter) || this.isLineClearing) {
      return;
    }
    
    switch (action) {
      case Action.Enter:
        switch (this.gameState.value) {
          case GameState.End:
            this.gameState.value = GameState.NotStarted;
            break;
          case GameState.NotStarted:
            this.isReplayMode = false;
            this.restart();
            break;
          case GameState.Playing:
            if (this.isReplayMode) {
              this.gameState.value = GameState.End;
            } else {
              this.gameState.value = GameState.Paused;
            }
            break;
          case GameState.Paused:
            this.gameState.value = GameState.Playing;
            break;
        }
        break;
      case Action.Rotate:
      case Action.Left:
      case Action.Right:
        this.resetLockDelayIfIsTime();
      default:
        if (this.isReplayMode || this.gameState.value != GameState.Playing) {
          return;
        }
        const now = new Date().getTime();
        let canRepeat = false;
        const lastRepeatTime = this.actionLastRepeatTimeMap.get(action);
        if (lastRepeatTime) {
          canRepeat = now - lastRepeatTime >
            (action == Action.Down ? delay.BLOCK_DOWN : delay.BLOCK_H_MOVE);
        } else {
          canRepeat = true;
        }
        if (canRepeat) {
          this.actionLastRepeatTimeMap.set(action, now);
          this.inputAction = action;
        }
        break;
    }
  }

  doBlockAction(action: Action) {
    const currentBlock = this.currentBlock.value;
    let isRecord = false;
    switch (action) {
      case Action.Up:
      case Action.Rotate:
        if (currentBlock.rotate()) {
          isRecord = true;
          this.gameplayAudio.play('rotate');
        }
        break;
      case Action.Left:
        if (currentBlock.left(-1)) {
          isRecord = true;
          this.gameplayAudio.play('move');
        }
        break;
      case Action.Right:
        if (currentBlock.left(+1)) {
          isRecord = true;
          this.gameplayAudio.play('move');
        }
        break;
      case Action.Down:
        if (currentBlock.canFall()) {
          isRecord = true;
          this.gameplayAudio.play('move');
        }
        break;
      case Action.HardDrop:
        this.isHardDropping = true;
        isRecord = true;
        break;
    }
    if (!this.isReplayMode && isRecord) {
      const replayFrame = new ReplayFrame(this.replayRecordFrameIndex, action);
      this.replayRecoder.record(replayFrame);
    }
  }
  
  onKeyDown(key: InputKey, event?: KeyboardEvent) {
    switch (key) {
      case InputKey.R:
        this.isReplayMode = false;
        this.restart();
        break;
      // 调试回放用
      case InputKey.G:
        if (this.replay) {
          this.replay.endFrame = this.replayRecordFrameIndex;
          this.isReplayMode = true;
          this.restart();
        } else {
          alert('还没有回放数据，请先游戏');
        }
        break;
      default:
        const action = this.keyBindingManager.getActionByKey(key);
        if (action) {
          this.onAction(action);
        }
    }
  }

  onKeyUp(key: InputKey, event?: KeyboardEvent) {}

  private setupUpdateLoop() {
    const onUpdate = this.onUpdate.bind(this);
    let lastTime = 0;
    function update(time: number) {
      const dt = (time - (lastTime == 0 ? time : lastTime)) / 1000;
      onUpdate(dt);
      lastTime = time;
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }
}