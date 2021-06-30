function positiveMod(n: number, k: number): number {
  return ((n % k) + k) % k;
}

export class XorShiftRng {
  private state: number;

  private constructor(state: number) {
    this.state = state;
  }

  public static withSeed(seed: number): XorShiftRng {
    if (!Number.isInteger(seed)) {
      throw new Error('seed must be integer');
    }
    if (seed === 0) {
      throw new Error('seed must be non-zero');
    }
    return new XorShiftRng(seed);
  }

  public static withRandomSeed(): XorShiftRng {
    for (;;) {
      const seed = Math.floor(Math.random() * (1 << 31));
      if (seed !== 0) {
        return new XorShiftRng(seed);
      }
    }
  }

  public gen(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x;
    return x;
  }

  public shuffleInPlaceFloat32Array(data: Float32Array): void {
    for (let i = data.length - 1; i >= 1; i -= 1) {
      const num = this.gen();
      const index = positiveMod(num, i + 1);
      const tmp = data[index];
      data[index] = data[i];
      data[i] = tmp;
    }
  }

  public clone(): XorShiftRng {
    return new XorShiftRng(this.state);
  }
}
