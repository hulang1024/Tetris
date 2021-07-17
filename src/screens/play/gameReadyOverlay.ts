export class GameReadyOverlay {
  el: HTMLElement;

  onStart: () => void;

  constructor() {
    const el = this.el = document.createElement('div');
    el.classList.add('game-ready-overlay');

    const menu = document.createElement('div');
    menu.classList.add('menu');
    el.appendChild(menu);

    const btnRestart = document.createElement('div');
    btnRestart.classList.add('button', 'start');
    btnRestart.innerText = '开始游戏';
    btnRestart.onclick = () => this.onStart();
    menu.appendChild(btnRestart);
  }
}