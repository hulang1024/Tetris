import { BlockGenerator } from "./blockGenerator";
import { TetrisGame } from "./TetrisGame";

const mainEl = document.querySelector('.main');
const blockGenerator = new BlockGenerator(new Date().getTime().toString());
const game = new TetrisGame(blockGenerator)
mainEl.appendChild(game.tetrisWindow.el);
// mainEl.appendChild(new TetrisGame(blockGenerator).tetrisWindow.el);
