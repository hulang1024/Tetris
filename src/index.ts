import "current-device";
import { TetrisGame } from "./screens/play/TetrisGame";

window.onload = () => {
  const game = new TetrisGame();
  const playfieldEl = document.querySelector('.main > .playfield');
  playfieldEl.appendChild(game.tetrisWindow.el);
}
