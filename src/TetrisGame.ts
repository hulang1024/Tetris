import { Block, typicalBlockDirTable } from "./block";
import { Game } from "./Game";
import { InputKey } from "./input/keys";
import { GameMap } from "./map";
import { TetrisWindow } from "./TetrisWindow";
import Bindable from "./utils/bindables/Bindable";
import { BlockGenerator } from "./blockGenerator";
import { Action } from "./action";
import ReplayRecorder from "./replay/ReplayRecorder";
import { Replay, ReplayFrame } from "./replay/replay";
import { ScoreProcessor } from "./scoring/ScoreProcessor";
import { levelLinesTable, levelSpeedTable } from "./level";
import { randomInt } from "./utils/random";
import * as delay from "./input/delay";

enum GameState {
  NotStarted,
  Playing,
  Paused,
  End
}

export class TetrisGame extends Game {
  gameState = new Bindable<GameState>(GameState.NotStarted);

  gameMap: GameMap;
  currentBlock: Block;
  nextBlock = new Bindable<Block>();
  blockCount = 0;
  tetrisWindow: TetrisWindow;
  blockGenerator: BlockGenerator;

  level = new Bindable<number>(0);
  levelSpeedFrames: number;
  levelLines: number;
  scoreProcessor: ScoreProcessor = new ScoreProcessor();
  isLineClearing = false;

  isReplayMode = false;
  gameStartTimestamp: number = 0;
  replayRecoder: ReplayRecorder = new ReplayRecorder();
  replay: Replay;
  replayNowFrameIndex: number = 0;

  actionLastRepeatTimeMap: Map<Action, number> = new Map();

  constructor() {
    super();
    this.blockGenerator = new BlockGenerator(new Date().getTime().toString());
    const mapHeight = document.body.offsetHeight - 166 - 16;
    this.gameMap = new GameMap(20, 10, Math.min(24, Math.floor(mapHeight / 20)));
    this.tetrisWindow = new TetrisWindow(
      this.gameMap, this.nextBlock, this.level, this.scoreProcessor);

    this.level.addAndRunOnce((level: number) => {
      console.log('level', level);
      this.levelLines = 0;
      this.levelSpeedFrames = levelSpeedTable[level];
    });

    this.gameState.addAndRunOnce((gameState) => {
      const { readyOverlay, pauseOverlay, overOverlay } = this.gameMap;
      readyOverlay.classList[gameState == GameState.NotStarted ? 'add' : 'remove']('show');
      pauseOverlay.classList[gameState == GameState.Paused ? 'add' : 'remove']('show');
      overOverlay.classList[gameState == GameState.End ? 'add' : 'remove']('show');
    });
  }

  createBlock() {
    const type = this.blockGenerator.getBlockType(this.blockCount++);
    const dir = randomInt(0, 4);//typicalBlockDirTable[type];
    return new Block(type, dir, 0, (this.gameMap.cols - 4) / 2, this.gameMap);
  }
  
  updateAccTime = 0;
  
  onUpdate(dt: number) {
    if (this.gameState.value != GameState.Playing) {
      return;
    }

    if (this.isReplayMode) {
      const { frames } = this.replay;
      const now = new Date().getTime();
      while (this.replayNowFrameIndex < frames.length) {
        const frame = frames[this.replayNowFrameIndex];
        if (now - this.gameStartTimestamp > frame.time) {
          this.doBlockAction(frame.action);
          this.replayNowFrameIndex++;
        } else {
          break;
        }
      }
    }

    this.updateAccTime += dt;
    if (this.updateAccTime * 1000 < this.levelSpeedFrames * 16.666) {
      return;
    }
    this.updateAccTime = 0;
  
    if (this.isLineClearing) {
      return;
    }

    const { gameMap, currentBlock } = this;
    if (!currentBlock.fall()) {
      this.scoreProcessor.onBottom();

      const canClearLine = gameMap.checkClearLine((lines) => {
        this.isLineClearing = true;
        navigator.vibrate?.(lines * 20);
      }, (lines) => {
        this.isLineClearing = false;
        if (lines) {
          this.scoreProcessor.onClearLines(lines);
          this.levelLines += lines;
          this.checkUpLevel();
        }
        
        if (this.isReplayEnd()) {
          this.gameOver();
        }
        if (canClearLine || currentBlock.gridRow > 0) {
          this.currentBlock = this.nextBlock.value;
          gameMap.addBlock(this.currentBlock);
          this.nextBlock.value = this.createBlock();
        } else {
          this.gameOver();
        }
      });
    } else {
      if (this.isReplayEnd()) {
        this.gameOver();
      }
    }
  }

  restart() {
    this.gameMap.clear();
    this.isLineClearing = false;
    this.scoreProcessor.reset();
    this.blockCount = 0;

    if (this.isReplayMode) {
      this.blockGenerator.reset(this.replay.prngSeed);
      this.replayNowFrameIndex = 0;
    } else {
      this.blockGenerator.reset(new Date().getTime().toString());
      const replay = new Replay()
      replay.prngSeed = this.blockGenerator.seed;
      this.replay = replay;
      this.replayRecoder.setReplay(replay);
    }

    this.currentBlock = this.createBlock();
    this.nextBlock.value = this.createBlock();
    this.gameMap.addBlock(this.currentBlock);

    this.gameStartTimestamp = new Date().getTime();

    this.gameState.value = GameState.Playing;
  }

  gameOver() {
    this.gameState.value = GameState.End;
    console.log(this.replayRecoder.replay);
  }

  checkUpLevel() {
    const diff = this.levelLines - levelLinesTable[this.level.value];
    if (diff < 0) {
      return;
    }

    this.level.value++;
  }

  isReplayEnd() {
    return this.isReplayMode && this.replayNowFrameIndex == this.replay.frames.length;
  }

  onAction(action: Action) {
    if ((this.gameState.value == GameState.Paused && action != Action.Enter) || this.isLineClearing) {
      return;
    }
    
    switch (action) {
      case Action.Enter:
        switch (this.gameState.value) {
          case GameState.NotStarted:
          case GameState.End:
            this.restart();
            break;
          case GameState.Playing:
            this.gameState.value = GameState.Paused;
            break;
          case GameState.Paused:
            this.gameState.value = GameState.Playing;
            break;
        }
        break;
      default:
        const isGameReady = this.gameState.value == GameState.NotStarted
          || this.gameState.value == GameState.End;
        if (isGameReady) {
          switch (action) {
            case Action.Up:
            case Action.Right:
              if (isGameReady && this.level.value < 29) {
                this.level.value++;
              }
              break;
            case Action.Down:
            case Action.Left:
              if (isGameReady && this.level.value > 0) {
                this.level.value--;
              }
              break;
          }
          return;
        }

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
          this.doBlockAction(action);
        }
        break;
    }
  }

  doBlockAction(action: Action) {
    const { currentBlock } = this;
    switch (action) {
      case Action.Up:
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
      case Action.HardDrop:
        while (currentBlock.fall());
        break;
    }
    if (!this.isReplayMode) {
      const replayFrame = new ReplayFrame(
        new Date().getTime() - this.gameStartTimestamp, action);
      this.replayRecoder.record(replayFrame);
    }
  }
  
  onKeyDown(key: InputKey, event?: KeyboardEvent) {
    super.onKeyDown(key, event);
    switch (key) {
      case InputKey.R:
        this.isReplayMode = false;
        this.restart();
        break;
      // 调试回放用
      case InputKey.G:
        if (this.replay) {
          this.isReplayMode = true;
          console.log(this.replay);
          this.restart();
        } else {
          alert('还没有回放数据，请先游戏');
        }
        break;
    }
  }
}