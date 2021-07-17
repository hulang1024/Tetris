import "current-device";
import { TetrisGame } from "./screens/play/play";
import { randomInt } from "./utils/random";

window.onload = () => {
  const game = new TetrisGame();
  const playfieldEl = document.querySelector('.main > .playfield');
  playfieldEl.appendChild(game.tetrisWindow.el);

  document.body.style.setProperty('--background-url', `url(./background/${randomInt(1, 4)}.jpg)`);
}
