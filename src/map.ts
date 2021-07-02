import { Block, blockCellSize, eachCells, setCellPosition } from "./block";

export class GameMap {
  el: HTMLElement;
  rows: number;
  cols: number;
  state: (number | null)[][] = [];
  blocks: Block[] = [];
  cells: (HTMLElement | null)[][] = [];

  get blockLayer() {
    return this.el.firstElementChild.children[1];
  }

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;

    const el = this.el = document.createElement('div');
    el.classList.add('map', 'bordered');

    const borderEl = document.createElement('div');
    borderEl.classList.add('border');
    el.appendChild(borderEl);

    const backgroundEl = document.createElement('div');
    backgroundEl.classList.add('background');
    borderEl.appendChild(backgroundEl);

    const blockLayerEl = document.createElement('div');
    blockLayerEl.classList.add('block-layer');
    borderEl.appendChild(blockLayerEl);

    el.style.setProperty('--width', `${blockCellSize * cols}px`);
    el.style.setProperty('--height', `${blockCellSize * rows}px`);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    let html = '';
    for (let r = 0; r < rows; r++) {
      this.state.push(new Array(cols));
      this.cells.push(new Array(cols));
      for (let c = 0; c < cols; c++) {
        this.state[r][c] = null;
        this.cells[r][c] = null;
        const x = c * blockCellSize;
        const y = r * blockCellSize;
        const size = blockCellSize;
        html += `<rect class="cell" x="${x}" y="${y}" width="${size}" height="${size}" />`;
      }
    }
    svg.innerHTML = html;

    backgroundEl.appendChild(svg);
  }

  addBlock(block: Block) {
    this.setBlockState(block, block.type);
    this.blocks.push(block);
    this.blockLayer.appendChild(block.el);
  }

  easeBlockState(block: Block) {
    this.setBlockState(block, null);
  }

  setBlockState(block: Block, state = block.type) {
    eachCells(block.value, (r, c, i) => {
      const sr = block.gridRow + r;
      const sc = block.gridCol + c;
      if (sr >= 0 && sc >= 0) {
        this.state[sr][sc] = state;
        this.cells[sr][sc] = state === null ? null : block.cells[i];
      }
    });
  }

  checkClearLine(startClear: (lineCount: number) => void, cb: () => void) {
    const idxs = this.findFullLineIndexs();
    if (idxs.length) {
      startClear(idxs.length);
      this.clearLines(idxs, cb);
      return true;
    } else {
      cb();
      return false;
    }
  }

  clearLines(lineIndexs: number[], cb: () => void) {
    for(let i = 0; i < lineIndexs.length; i++) {
      for (let c = 0; c < this.cols; c++) {
        const r = lineIndexs[i];
        const cell = this.cells[r][c];
        if (cell) {
          cell.parentElement.removeChild(cell);
          this.cells[r][c] = null;

          const block = this.blocks.find((b) => b.cells.find((c) => c == cell));
          if (block) {
            const ci = block.cells.findIndex((c) => c == cell);
            block.cells.splice(ci, 1);
          }
        }
      }
    }
    
    this.blocks.forEach((block, i) => {
      if (block.cells.length == 0) {
        block.el.parentElement.removeChild(block.el);
        this.blocks.splice(i, 1);
      }
    });

    for(let i = 0; i < lineIndexs.length; i++) {
      for(let r = lineIndexs[i] - 1; r >= 0; r--) {
        for(let c = 0; c < this.cols; c++) {
          this.state[r + 1][c] = this.state[r][c];
          this.cells[r + 1][c] = this.cells[r][c];
        }
      }
    }

    setTimeout(() => {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const cell = this.cells[r][c];
          if (cell) {
            setCellPosition(cell, r, c);
          }
        }
      }
      cb();
    }, 16 * 10);
  }

  findFullLineIndexs() {
    let idxs = [];
    let isFull;
    for (let r = 0; r < this.rows; r++) {
      isFull = true;
      for (let c = 0; isFull && c < this.cols; c++) {
        isFull = !this.isEmpty(r, c);
      }
      if (isFull) {
        idxs.push(r);
      }
    }
    return idxs;
  }

  printState() {
    for (let r = 0; r < this.rows; r++) {
      let s = '';
      for (let c = 0; c < this.cols; c++) {
        s += this.state[r][c] ?? '_';
      }
      console.log(s + '\n');
    }
  }

  clear() {
    for(let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.state[r][c] = null;
        this.cells[r][c] = null;
      }
    }

    this.blocks.forEach((block) => {
      block.el.parentElement.removeChild(block.el);
    });
    this.blocks = [];
  }

  isEmpty(row: number, col: number) {
    return this.state[row][col] === null;
  }
  
  isInBounds(row: number, col: number) {
    return (0 <= row && row < this.rows) && (0 <= col && col < this.cols);
  }
}