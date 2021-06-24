import * as leftPad from "../node_modules/left-pad/index";
import { Block } from "./block";
import { GameMap } from "./map";
import Bindable from "./utils/bindables/Bindable";

export class TetrisWindow {
  el: HTMLElement;
  nextBlock: Bindable<Block>;
  clearLineCount: Bindable<number>;

  constructor(gameMap: GameMap, nextBlock: Bindable<Block>, clearLineCount: Bindable<number>) {
    const el = this.el = document.createElement('div');
    el.classList.add('tetris-window');
    el.innerHTML = `
      <div class="block-row">
        <div class="clear-lines bordered">
          <div class="border">
            <div>LINE</div>
            <div class="num">000</div>
          </div>
        </div>
        <div class="next-block bordered">
          <div class="border"></div>
        </div>
      </div>
    `;
    el.appendChild(gameMap.el);

    nextBlock.addAndRunOnce((block: Block) => {
      if (block == null) return;
      const container = el.querySelector('.next-block > .border');
      container.innerHTML = '';
      const tBlock = new Block(block.type, block.dir, 0, 0, gameMap);
      tBlock.trim();
      container.appendChild(tBlock.el);
    });
    
    clearLineCount.addAndRunOnce((count: number) => {
      const numEl = el.querySelector('.clear-lines .num') as HTMLElement;
      numEl.innerText = count < 1000 ? leftPad(count, 3, '0') : count.toString();
    });
  }
}


