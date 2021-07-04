import "current-device";
import { TetrisGame } from "./TetrisGame";

const game = new TetrisGame();
const playfieldEl = document.querySelector('.main > .playfield');
playfieldEl.appendChild(game.tetrisWindow.el);
