export class GamePauseOverlay {
  el: HTMLElement;

  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;

  constructor() {
    const el = this.el = document.createElement('div');
    el.classList.add('game-pause-overlay');

    const head = document.createElement('div');
    head.classList.add('head');
    head.innerHTML = '游戏暂停';
    el.appendChild(head);

    const menu = document.createElement('div');
    menu.classList.add('menu');
    el.appendChild(menu);

    const btnResume = document.createElement('div');
    btnResume.classList.add('button', 'resume');
    btnResume.innerText = '继续';
    btnResume.onclick = () => this.onResume();
    menu.appendChild(btnResume);

    const btnRestart = document.createElement('div');
    btnRestart.classList.add('button', 'restart');
    btnRestart.innerText = '重新开始';
    btnRestart.onclick = () => this.onRestart();
    menu.appendChild(btnRestart);

    const btnQuit = document.createElement('div');
    btnQuit.classList.add('button', 'quit');
    btnQuit.innerText = '退出';
    btnQuit.onclick = () => this.onQuit();
    menu.appendChild(btnQuit);
  }
}