import { Block } from "./block";
import { GameMap } from "./map";
import { ScoreProcessor } from "../../scoring/ScoreProcessor";
import Bindable from "../../utils/bindables/Bindable";
import BindableList from "../../utils/bindables/BindableList";

export class TetrisWindow {
  el: HTMLElement;
  clearLineCount: Bindable<number>;
  score: Bindable<number>;

  constructor(
    gameMap: GameMap,
    nextBlockQueue: BindableList<Block>,
    level: Bindable<number>,
    scoreProcessor: ScoreProcessor
  ) {
    const el = this.el = document.createElement('div');
    el.classList.add('tetris-window');
    el.innerHTML = `
      <div class="stat">
        <div class="next bordered">
          <div class="title">NEXT</div>
          <div class="block-container"></div>
        </div>
        <div class="score counter bordered">
          <div class="title">SCORE</div>
          <div class="num">0</div>
        </div>
        <div class="level counter bordered">
          <div class="title">LEVEL</div>
          <div class="num">0</div>
        </div>
        <div class="lines counter bordered">
          <div class="title">LINES</div>
          <div class="num">0</div>
        </div>
      </div>
    `;
    el.appendChild(gameMap.el);

    const levelNumEl = el.querySelector('.level .num') as HTMLElement;
    const scoreNumEl = el.querySelector('.score .num') as HTMLElement;
    const linesNumEl = el.querySelector('.lines .num') as HTMLElement;
    const nextContainer = el.querySelector('.next') as HTMLElement;
    const nextBlockContainer = el.querySelector('.next .block-container') as HTMLElement;
    const nextBlockCellSize = 16;
    nextContainer.style.setProperty('--block-cell-size', `${nextBlockCellSize}px`);
    nextContainer.style.setProperty('--next-block-queue-capacity', 4 + '');

    nextBlockQueue.added.add((block: Block) => {
      if (block == null) return;
      const tBlock = new Block(block.type, block.dir, 0, 0, gameMap, nextBlockCellSize);
      tBlock.trim();
      nextBlockContainer.appendChild(tBlock.el);
    });

    nextBlockQueue.removed.add((block: Block) => {
      nextBlockContainer.removeChild(nextBlockContainer.firstElementChild);
    });

    level.addAndRunOnce((num: number) => {
      levelNumEl.innerText = num.toString();
    });

    scoreProcessor.score.addAndRunOnce((num: number) => {
      scoreNumEl.innerText = num.toString();
    });

    scoreProcessor.lines.addAndRunOnce((num: number) => {
      linesNumEl.innerText = num.toString();
    });
  }
}


