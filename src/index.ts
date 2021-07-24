import "current-device";
import { TetrisGame } from "./screens/play/play";

window.onload = () => {
  const game = new TetrisGame();
  const playfieldEl = document.querySelector('.main > .playfield');
  playfieldEl.appendChild(game.tetrisWindow.el);
}
