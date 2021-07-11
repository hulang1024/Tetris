export class GameOverOverlay {
  el: HTMLElement;

  onRestart: () => void;
  onWatchReplay: () => void;

  constructor() {
    const el = this.el = document.createElement('div');
    el.classList.add('game-over-overlay');

    const head = document.createElement('div');
    head.classList.add('head');
    head.innerHTML = '游戏结束';
    el.appendChild(head);

    const menu = document.createElement('div');
    menu.classList.add('menu');
    el.appendChild(menu);

    const btnRestart = document.createElement('div');
    btnRestart.classList.add('button', 'restart');
    btnRestart.innerText = '重新开始';
    btnRestart.onclick = () => this.onRestart();
    menu.appendChild(btnRestart);

    const btnWatchReplay = document.createElement('div');
    btnWatchReplay.classList.add('button', 'watch-replay');
    btnWatchReplay.innerText = '观看回放';
    btnWatchReplay.onclick = () => this.onWatchReplay();
    menu.appendChild(btnWatchReplay);
  }
}