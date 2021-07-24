import { Block, eachCells, setCellPosition } from "./block";

export class GameMap {
  el: HTMLElement;
  rows: number;
  cols: number;
  state: (number | null)[][] = [];
  blocks: Block[] = [];
  cells: (HTMLElement | null)[][] = [];
  blockCellSize: number;

  blockLayer: HTMLElement;

  constructor(rows: number, cols: number, blockCellSize: number) {
    this.rows = rows;
    this.cols = cols;
    this.blockCellSize = blockCellSize;

    const el = this.el = document.createElement('div');
    el.classList.add('map', 'bordered');

    const backgroundEl = document.createElement('div');
    backgroundEl.classList.add('background');
    el.appendChild(backgroundEl);

    const blockLayerEl = document.createElement('div');
    blockLayerEl.classList.add('block-layer');
    el.appendChild(blockLayerEl);
    this.blockLayer = blockLayerEl;

    const borderWidth = 2;
    el.style.setProperty('--width', `${blockCellSize * cols + borderWidth * 2}px`);
    el.style.setProperty('--height', `${blockCellSize * rows + borderWidth * 2}px`);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    let html = '';
    const cellSize = blockCellSize;
    for (let r = 0; r < rows; r++) {
      this.state.push(new Array(cols));
      this.cells.push(new Array(cols));
      for (let c = 0; c < cols; c++) {
        this.state[r][c] = null;
        this.cells[r][c] = null;
        const x = c * cellSize;
        const y = r * cellSize;
        html += `<rect class="cell" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" />`;
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
    if (block.isShadow) {
      return;
    }
    eachCells(block.value, (r, c, i) => {
      const sr = block.gridRow + r;
      const sc = block.gridCol + c;
      if (sr >= 0 && sc >= 0) {
        this.state[sr][sc] = state;
        this.cells[sr][sc] = state === null ? null : block.cells[i];
      }
    });
  }

  checkClearLine(startClear: (lineCount: number) => void, cb: (lineCount: number) => void) {
    const idxs = this.findFullLineIndexs();
    if (idxs.length) {
      startClear(idxs.length);
      this.clearLines(idxs, cb);
    } else {
      cb(idxs.length);
    }
    return idxs.length;
  }

  clearLines(lineIndexs: number[], cb: (lineCount: number) => void) {
    const clearDuration = 16.666 * 10;

    for(let i = 0; i < lineIndexs.length; i++) {
      const r = lineIndexs[i];
      for (let p = 0; p < 5; p++) {
        for (let pi = 0; pi < 2; pi++) {
          const c = pi == 0 ? 4 - p : 5 + p;

          const cell = this.cells[r][c];
          if (!cell) {
            continue;
          }

          cell.style.setProperty('--opactiy-duration',
            `${((p + 1) * 2) * (clearDuration / this.cols) / 1000}s`);
          cell.classList.add('hide');
          this.cells[r][c] = null;

          const block = this.blocks.find((b) => b.cells.find((c) => c == cell));
          if (block) {
            const ci = block.cells.findIndex((c) => c == cell);
            block.cells.splice(ci, 1);
          }
        }
      }
    }

    setTimeout(() => {
      for(let i = 0; i < lineIndexs.length; i++) {
        for (let c = 0; c < this.cols; c++) {
          const r = lineIndexs[i];
          const cell = this.cells[r][c];
          if (cell) {
            cell.parentElement.removeChild(cell);
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
  
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const cell = this.cells[r][c];
          if (cell) {
            cell.classList.add('clear-drop');
            setCellPosition(cell, r, c, this.blockCellSize);
          }
        }
      }
      setTimeout(() => {
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            const cell = this.cells[r][c];
            if (cell) {
              cell.classList.remove('clear-drop');
            }
          }
        }
        cb(lineIndexs.length);
      }, 200 + 60);
    }, clearDuration);
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
      if (block.isShadow) {
        return;
      }
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