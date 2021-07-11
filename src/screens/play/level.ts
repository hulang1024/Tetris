export const levelSpeedTable: Record<number, number> = (() => {
  const table: Record<number, number> = {};
  let level = 0;
  let frames = 5;
  for (; level < 9; level++) {
    table[level] = 48 - level * frames;
  }
  frames = 6;
  table[level++] = frames--;
  for (; level < 17; level += 3) {
    table[level + 0] = frames;
    table[level + 1] = frames;
    table[level + 2] = frames;
    frames--;
  }
  for (; level < 29; level++) {
    table[level] = frames;
  }
  table[level] = --frames;
  return table;
})();

export const levelLinesTable: Record<number, number> = (() => {
  const table: Record<number, number> = {};
  for (let level = 0; level < 30; level++) {
    table[level] = 3;
  }
  return table;
})();