import { Block, typicalBlockDirTable } from "./block";
import KeyboardHandler from "./input/KeyboardHandler";
import KeyboardState from "./input/KeyboardState";
import { InputKey } from "./input/keys";
import { GameMap } from "./map";
import { randomInt } from "./utils";

const keyboardState: KeyboardState = new KeyboardState();
new KeyboardHandler({
  onKeyDown: (key, event) => {
    onKeyDown(key, event);
    if (!event.repeat) {
      keyboardState.keys.setPressed(key, true);
    }
  },
  onKeyUp: (key, event) => {
    onKeyUp(key, event);
    if (!event.repeat) {
      keyboardState.keys.setPressed(key, false);
    }
  },
});

function createBlock() {
  const type = randomInt(0, 7);
  const dir = typicalBlockDirTable[type];
  return new Block(type, dir, -4, (gameMap.cols - 4) / 2, gameMap);
}

function updateNextBlockDisplay() {
  const container = document.querySelector('.next-block > .border');
  container.innerHTML = '';
  const tBlock = new Block(nextBlock.type, nextBlock.dir, 0, 0, gameMap);
  tBlock.trim();
  container.appendChild(tBlock.el);
}

let isPause = true;
const gameMap = new GameMap(20, 10);
let currentBlock = createBlock();
let nextBlock = createBlock();
let lineClearing = false;
updateNextBlockDisplay();
gameMap.addBlock(currentBlock);

setupUpdateLoop();

let updateAccTime = 0;

function onUpdate(dt: number) {
  if (isPause) {
    return;
  }
  updateAccTime += dt;
  if (updateAccTime * 1000 < 200) {
    return;
  }
  updateAccTime = 0;

  if (lineClearing) {
    return;
  }

  if (!currentBlock.fall()) {
    currentBlock = nextBlock;
    gameMap.addBlock(currentBlock);
    nextBlock = createBlock();
    updateNextBlockDisplay();
    gameMap.checkClearLine(() => {
      lineClearing = true;
    }, () => {
      lineClearing = false;
    });
  }
}

function setupUpdateLoop() {
  // 保存上一帧的时间戳
  let lastTime = 0;
  // 定义 update，update 是一个更新循环
  // 参数 time 是 requestAnimationFrame 传递的当前帧的时间戳
  function update(time: number) {
    // 计算上一帧和当前帧的间隔时间
    // 60FPS情况下 dt 在 16.6 左右（在这里除以1000，以得到一个小数0.0166，更适合onUpdate用）
    const dt = (time - (lastTime == 0 ? time : lastTime)) / 1000;
    // 调用 onUpdate，传递 dt
    onUpdate(dt);
    // 记录本帧时间戳
    lastTime = time;
    // 设置下一帧回调
    requestAnimationFrame(update);
  }
  // 启动循环
  requestAnimationFrame(update);
}

function onKeyDown(key: InputKey, event?: KeyboardEvent) {
  if (isPause && key != InputKey.Enter) {
    return;
  }
  switch (key) {
    case InputKey.Up:
      currentBlock.rotate();
      break;
    case InputKey.Down:
      currentBlock.fall();
      break;
    case InputKey.Right:
      currentBlock.left(+1);
      break;
    case InputKey.Left:
      currentBlock.left(-1);
      break;
    case InputKey.Enter:
      isPause = !isPause;
      break;
    case InputKey.Space:
      while (currentBlock.fall());
        break;
  }
}

function onKeyUp(key: InputKey, event?: KeyboardEvent) {

}