import "current-device";
import { TetrisGame } from "./TetrisGame";

const game = new TetrisGame();
const playfieldEl = document.querySelector('.main > .playfield');
playfieldEl.appendChild(game.tetrisWindow.el);

if (window.device.desktop()) {
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
}