

function printBlock(n, color) {
  let s = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c;
      const v = n & (0x008000 >> i);
      s += v ? '*' : ' ';
    }
    s += '\n';
  }
  console.log('%c' + s, 'color:' + color);
}

function printBin(n) {
  let s = n.toString(2);
  for (let i = 0, e = 32 - s.length; i < e; i++) {
    s = '0' + s;
  }
  return s;
}

for (let t = 0; t < blockTable.length; t++) {
  for (let d = 0; d < 1; d++) {
    printBlock(blockTable[t][d], blockColorTable[t]);
  }
  console.log('\n');
}
