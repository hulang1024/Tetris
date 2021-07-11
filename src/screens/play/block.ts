import { GameMap } from "./map";

// 各个种类方块四个方向的编码，高16位编码旋转掩码，低16位编码形状扫描码
const blockTable = [
  [0xEE206C00, 0x66E04620, 0x8EE006C0, 0xECC08C40],   //S
  [0xE660C600, 0x2EE02640, 0xEE800C60, 0xCCE04C80],   //Z
  [0xECC088C0, 0xEE20E800, 0x66E06220, 0x8EE002E0],   //L
  [0x2EE02260, 0xCCE008E0, 0xEE80C880, 0xE660E200],   //J
  [0x7FCC4444, 0xEF330F00, 0x33FE2222, 0xCCF700F0],   //I
  [0xCC00CC00, 0xCC00CC00, 0xCC00CC00, 0xCC00CC00],   //O
  [0xE620E400, 0x26E02620, 0x8CE004E0, 0xEC808C80]    //T
];

export const typicalBlockDirTable = [0, 0, 1, 1, 1, 0, 0];

const blockColorTable = [
  '#f44336', '#85cc33', '#ffa500', '#ff69b4',
  '#00bcd4', '#ebd300', '#9370db'
];

export enum Dir {
  Up,
  Right,
  Down,
  Left,
}

export class Block {
  // 当前在网格中的位置
  gridRow: number;
  gridCol: number;
  
  el: HTMLElement;
  cells: HTMLElement[] = [];
  cellSize: number;

  map: GameMap;

  private _isShadow: boolean;
  get isShadow() { return this._isShadow; }

  // 种类
  private _type: number;
  get type() { return this._type; }
  set type(val) {
    if (this._isShadow) {
      this._type = val;
      this.el.style.setProperty('--color', blockColorTable[this._type]);
    }
  }

  // 方向
  private _dir: Dir;
  get dir() { return this._dir; }
  set dir(val) {
    if (this._isShadow) {
      this._dir = val;
    }
  }

  get value() { return blockTable[this.type][this.dir]; }

  constructor(
    type: number, dir: Dir,
    gridRow: number, gridCol: number,
    map: GameMap,
    cellSize?: number
  ) {
    this.cellSize = cellSize ?? map.blockCellSize;
    this.map = map;

    const el = this.el = document.createElement('div');
    el.classList.add('block');
    if (-1 <= type && type <= 6) {
      for (let i = 0; i < 4; i++) {
        const cell = createBlockCell(this.cellSize);
        this.cells.push(cell);
        el.appendChild(cell);
      }
    }

    this._type = type;
    this._dir = dir;
    this._isShadow = type == -1;

    if (this._isShadow) {
      el.classList.add('shadow');
    }

    if (type > -1) {
      this.el.style.setProperty('--color', blockColorTable[this._type]);
      this.setPosition(gridRow, gridCol);
    }
  }

  rotate() {
    this.map.easeBlockState(this);
    if (this.canRotate()) {
      this._dir = (this.dir + 1) % 4;
      this.map.setBlockState(this);
      this.setPosition(this.gridRow, this.gridCol, true);
      return true;
    } else {
      this.map.setBlockState(this);
      return false;
    }
  }

  left(v: 1 | -1) {
    this.map.easeBlockState(this);
    if (this.canMove(this.gridRow, this.gridCol + v)) {
      this.setPosition(this.gridRow, this.gridCol + v);
      this.map.setBlockState(this);
      return true;
    }
    return false;
  }

  fall() {
    this.map.easeBlockState(this);
    if (this.canMove(this.gridRow + 1, this.gridCol)) {
      this.setPosition(this.gridRow + 1, this.gridCol);
      this.map.setBlockState(this);
      return true;
    } else {
      this.map.setBlockState(this);
      return false;
    }
  }

  lock() {
    this.el.classList.add('locked');
  }

  canFall(rows = 1) {
    return this.canMove(this.gridRow + rows, this.gridCol);
  }

  canMove(gridRow: number, gridCol: number) {
    let ret: boolean | null = null;
    eachCells(this.value, (r, c) => {
      const gr = Math.max(0, gridRow + r);
      const gc = gridCol + c;
      if (ret === null && !(this.map.isInBounds(gr, gc) && this.map.isEmpty(gr, gc))) {
        ret = false;
      }
    });
    return ret ?? true;
  }

  canRotate() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const i = r * 4 + c;
        if ((this.value >> 16) & (0x008000 >> i)) {
          const gr = Math.max(0, this.gridRow + r);
          const gc = this.gridCol + c;
          if (!(this.map.isInBounds(gr, gc) && this.map.isEmpty(gr, gc))) {
            return false;
          }
        }
      }
    }
    return true;
  }

  setPosition(gridRow: number, gridCol: number, force = false) {
    let changed = false;
    if (this.gridRow != gridRow) {
      this.gridRow = gridRow;
      changed = true;
    }
    if (this.gridCol != gridCol) {
      this.gridCol = gridCol;
      changed = true;
    }
    if (changed || force) {
      eachCells(this.value, (r, c, i) => {
        setCellPosition(this.cells[i], this.gridRow + r, this.gridCol + c, this.cellSize);
      });
    }
  }

  show() {
    this.el.classList.remove('hide');
  }

  hide() {
    this.el.classList.add('hide');
  }

  trim() {
    let arr: boolean[][] = [];
    eachCells(this.value, (r, c, i, hasCell) => {
      arr[r] ??= new Array(4);
      arr[r][c] = hasCell;
    }, true);

    let start = 0;
    let end = 4;
    let rows = 0;
    
    for (let r = 0; r < 4; r++) {
      if (arr[r].some(Boolean)) {
        start = r;
        break;
      }
    }
    for (let r = 3; r >= 0; r--) {
      if (arr[r].some(Boolean)) {
        end = r;
        break;
      }
    }
    arr = arr.slice(start, end + 1);
    rows = end - start + 1;

    let cols = 0;
    for (let c = 0; c < 4; c++) {
      let b = false;
      for (let r = 0; r < rows; r++) {
        if (arr[r][c]) {
          b = true;
          break;
        }
      }
      if (b) {
        start = c;
        break;
      }
    }
    for (let c = 3; c >= 0; c--) {
      let b = false;
      for (let r = 0; r < rows; r++) {
        if (arr[r][c]) {
          b = true;
          break;
        }
      }
      if (b) {
        end = c;
        break;
      }
    }

    for (let r = 0; r < rows; r++) {
      arr[r] = arr[r].slice(start, end + 1);
    }
    cols = end - start + 1;

    const { el } = this;
    el.style.width = `${this.cellSize * cols}px`;
    el.style.height = `${this.cellSize * rows}px`;

    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!arr[r][c]) {
          continue;
        }
        setCellPosition(this.cells[i++], this.gridRow + r, this.gridCol + c, this.cellSize);
      }
    }
  }
}

export function setCellPosition(cell: HTMLElement, row: number, col: number, cellSize: number) {
  cell.style.setProperty('--x', `${col * cellSize}px`);
  cell.style.setProperty('--y', `${row * cellSize}px`);
}

export function eachCells(
  block: number,
  fn: (r: number, c: number, i?: number, hasCell?: boolean) => void,
  all = false,
) {
  let j = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c;
      const hasCell = !!(block & (0x008000 >> i));
      if (all || hasCell) {
        fn(r, c, j++, hasCell);
      }
    }
  }
}

function createBlockCell(size: number, color?: string) {
  const el = document.createElement('div');
  el.classList.add('cell');
  el.style.setProperty('--size', `${size}px`);

  if (color) {
    el.style.setProperty('--color', color);
  }
  return el;
}