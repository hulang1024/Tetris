import * as seedrandom from "seedrandom";

export class BlockTypeInfo {
  type: number;
  dir: number;

  constructor(type: number, dir: number) {
    this.type = type;
    this.dir = dir;
  }
}

export class BlockGenerator {
  seed: string;
  private prng: any;
  private blockTypes: BlockTypeInfo[] = [];

  constructor(seed: string) {
    this.reset(seed);
  }

  getBlockType(index: number) {
    if (index > this.blockTypes.length - 1) {
      const value = this.prng();
      const type = Math.floor(value * 7);
      const dir = Math.floor(value * 4);//typicalBlockDirTable[type];
      this.blockTypes.push(new BlockTypeInfo(type, dir));
    }
    return this.blockTypes[index];
  }

  reset(seed: string) {
    this.seed = seed;
    this.blockTypes = [];
    this.prng = new (seedrandom as any)(seed);
  }
}