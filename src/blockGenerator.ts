import * as seedrandom from "seedrandom";

export class BlockGenerator {
  private prng: any;
  private blockTypes: number[] = [];

  constructor(seed: string) {
    this.prng = new (seedrandom as any)(seed);
  }

  getBlockType(index: number) {
    if (index > this.blockTypes.length - 1) {
      const value = this.prng();
      const blockType = Math.floor(value * 7);
      this.blockTypes.push(blockType);
    }
    return this.blockTypes[index];
  }

  reset() {
    this.blockTypes = [];
  }
}