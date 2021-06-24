import { Block, typicalBlockDirTable } from "./block";
import { Game } from "./Game";
import { InputKey } from "./input/keys";
import { GameMap } from "./map";
import { TetrisWindow } from "./TetrisWindow";
import Bindable from "./utils/bindables/Bindable";
import BindableBool from "./utils/bindables/BindableBool";
import { randomInt } from "./utils/random";
import { Alea } from 'seedrandom';
import { BlockGenerator } from "./blockGenerator";

export class TetrisGame extends Game {
  isPause = new BindableBool(true);
  readonly gameMap = new GameMap(20, 10);
  currentBlock: Block;
  nextBlock = new Bindable<Block>();
  clearLineCount = new Bindable<number>(0);
  lineClearing = false;
  blockCount = 0;
  tetrisWindow = new TetrisWindow(this.gameMap, this.nextBlock, this.clearLineCount);
  blockGenerator: BlockGenerator;

  constructor(blockGenerator: BlockGenerator) {
    super();
    this.blockGenerator = blockGenerator;

    this.currentBlock = this.createBlock();
    this.nextBlock.value = this.createBlock();
    this.gameMap.addBlock(this.currentBlock);

    const pauseOverlay = document.querySelector('.main .pause-overlay');
    this.isPause.addAndRunOnce((isPause) => {
      pauseOverlay.classList[isPause ? 'add' : 'remove']('show');
    });
  }

  createBlock() {
    const type = this.blockGenerator.getBlockType(this.blockCount++);
    const dir = typicalBlockDirTable[type];
    return new Block(type, dir, -3, (this.gameMap.cols - 4) / 2, this.gameMap);
  }
  
  updateAccTime = 0;
  
  onUpdate(dt: number) {
    if (this.isPause.value) {
      return;
    }
    this.updateAccTime += dt;
    if (this.updateAccTime * 1000 < 200) {
      return;
    }
    this.updateAccTime = 0;
  
    if (this.lineClearing) {
      return;
    }
    const { gameMap } = this;
    if (!this.currentBlock.fall()) {
      this.currentBlock = this.nextBlock.value;
      console.log('add block')
      gameMap.addBlock(this.currentBlock);
      this.nextBlock.value = this.createBlock();
      gameMap.checkClearLine(() => {
        this.lineClearing = true;
        this.clearLineCount.value++;
      }, () => {
        this.lineClearing = false;
      });
    }
  }
  
  onKeyDown(key: InputKey, event?: KeyboardEvent) {
    if (this.isPause.value && key != InputKey.Enter) {
      return;
    }
    const { currentBlock } = this;
    switch (key) {
      case InputKey.Up:
      case InputKey.W:
        currentBlock.rotate();
        break;
      case InputKey.Down:
      case InputKey.S:
        currentBlock.fall();
        break;
      case InputKey.Right:
      case InputKey.D:
        currentBlock.left(+1);
        break;
      case InputKey.Left:
      case InputKey.A:
        currentBlock.left(-1);
        break;
      case InputKey.Enter:
        this.isPause.toggle();
        break;
      case InputKey.Space:
        while (currentBlock.fall());
          break;
    }
  }
}