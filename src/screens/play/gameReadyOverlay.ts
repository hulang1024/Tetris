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

    const btnChangeLevel = document.createElement('div');
    btnChangeLevel.classList.add('button', 'change-level');
    btnChangeLevel.innerText = '调整等级';
    btnChangeLevel.onclick = () => {
      alert('请按方向键来调整');
    };
    menu.appendChild(btnChangeLevel);
  }
}