import { BlockGenerator } from "./blockGenerator";
import { TetrisGame } from "./TetrisGame";

const mainEl = document.querySelector('.main');
const blockGenerator = new BlockGenerator(new Date().getTime().toString());
const game = new TetrisGame(blockGenerator)

const gamepadEl = document.querySelector('.gamepad') as HTMLElement
mainEl.insertBefore(game.tetrisWindow.el, gamepadEl);

document.querySelector('#btn-help').addEventListener('click', () => {
  const keyTableEl = document.querySelector('#key-table') as HTMLElement;
  const isHide = keyTableEl.classList.contains('hide')
  if (isHide) {
    keyTableEl.classList.remove('hide');
    keyTableEl.classList.add('show');
  } else {
    keyTableEl.classList.remove('show');
    keyTableEl.classList.add('hide');
  }
});
