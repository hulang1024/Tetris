import { GameMap } from "./map";

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

export const blockCellSize = 22;

export enum Dir {
  Up,
  Right,
  Down,
  Left,
}

export class Block {
  gridRow: number;
  gridCol: number;
  
  el: HTMLElement;
  cells: SVGSVGElement[] = [];

  map: GameMap;

  private _type: number;
  get type() { return this._type; }

  private _dir: Dir;
  get dir() { return this._dir; }

  get value() { return blockTable[this.type][this.dir]; }

  constructor(type: number, dir: Dir, gridRow: number, gridCol: number, map: GameMap) {
    this._type = type;
    this._dir = dir;
    this.map = map;

    const el = this.el = document.createElement('div');
    el.classList.add('block');
    el.style.setProperty('--color', blockColorTable[type]);

    eachCells(this.value, (r, c) => {
      const cell = createBlockCell(blockCellSize);
      this.cells.push(cell);
      el.appendChild(cell);
    });

    this.setPosition(gridRow, gridCol);
  }

  rotate() {
    this.map.easeBlockState(this);
    if (this.canRotate()) {
      this._dir = (this.dir + 1) % 4;
      this.map.setBlockState(this);
      this.setPosition(this.gridRow, this.gridCol, true);
    } else {
      this.map.setBlockState(this);
    }
  }

  left(v: 1 | -1) {
    this.map.easeBlockState(this);
    if (this.canMove(this.gridRow, this.gridCol + v)) {
      this.setPosition(this.gridRow, this.gridCol + v);
      this.map.setBlockState(this);
    }
  }

  fall() {
    this.map.easeBlockState(this);
    if (this.gridRow < 0 || this.canMove(this.gridRow + 1, this.gridCol)) {
      this.setPosition(this.gridRow + 1, this.gridCol);
      this.map.setBlockState(this);
      return true;
    } else {
      this.map.setBlockState(this);
      return false;
    }
  }

  canMove(gridRow: number, gridCol: number) {
    let ret: boolean | null = null;
    eachCells(this.value, (r, c) => {
      if (ret === null
        && !(this.map.isInBounds(gridRow + r, gridCol + c)
          && this.map.isEmpty(gridRow + r, gridCol + c))) {
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
          const gr = this.gridRow + r;
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
        setCellPosition(this.cells[i], this.gridRow + r, this.gridCol + c);
      });
    }
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
    el.style.width = `${blockCellSize * cols}px`;
    el.style.height = `${blockCellSize * rows}px`;

    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!arr[r][c]) {
          continue;
        }
        setCellPosition(this.cells[i++], this.gridRow + r, this.gridCol + c);
      }
    }
  }
}

export function setCellPosition(cell: SVGSVGElement, row: number, col: number) {
  cell.style.setProperty('--x', `${col * blockCellSize}px`);
  cell.style.setProperty('--y', `${row * blockCellSize}px`);
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
  const strokeWidth = 1;
  size -= strokeWidth * 2;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('cell');
  svg.style.setProperty('--stroke-width', `${strokeWidth}px`);
  if (color) {
    svg.style.setProperty('--color', color);
  }
  svg.setAttribute('width', size.toString());
  svg.setAttribute('height', size.toString());

  const cornerSize = 2;
  const rect2Size = size - cornerSize * 2;
  const html = `
    <rect class="rect1" x="0" y="0" width="${size}" height="${size}" />
    <rect class="rect2" x="${cornerSize}" y="${cornerSize}" width="${rect2Size}" height="${rect2Size}" />
    <rect class="rect-corner" x="${cornerSize}" y="${cornerSize}" width="${cornerSize * 2}" height="${cornerSize}" />
    <rect class="rect-corner" x="${cornerSize}" y="${cornerSize}" width="${cornerSize}" height="${cornerSize * 2}" />  
  `;
  svg.innerHTML = html;
  return svg;
}