import { XorShiftRng } from './xor_shift_rng';

const PERMUTATION_TABLE: Uint8Array = new Uint8Array([
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36,
  103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0,
  26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56,
  87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
  77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55,
  46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132,
  187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109,
  198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126,
  255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183,
  170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43,
  172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112,
  104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162,
  241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106,
  157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205,
  93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
]);

// smoothly interpolate w amount between a0 and a1
function smootherstep(w: number): number {
  return (w * (w * 6.0 - 15.0) + 10.0) * w * w * w;
}

function gradientDotWeighted(offsetX: number, offsetY: number, gradientX: number, gradientY: number): number {
  return smootherstep(Math.abs(1 - Math.abs(offsetX))) * smootherstep(1 - Math.abs(offsetY)) * ((gradientX * offsetX) + (gradientY * offsetY));
}

export class PerlinNoise2D {
  private readonly gradX: Float32Array;
  private readonly gradY: Float32Array;

  public constructor(rng: XorShiftRng) {
    this.gradX = new Float32Array(256);
    this.gradY = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const angle = (Math.PI * 2 * i) / 256;
      this.gradX[i] = Math.cos(angle);
      this.gradY[i] = Math.sin(angle);
    }
    // make a copy of the rng so both arrays can be shuffled the same way
    const rngBak = rng.clone();
    rng.shuffleInPlaceFloat32Array(this.gradX);
    rngBak.shuffleInPlaceFloat32Array(this.gradY);
  }

  public noise(x: number, y: number): number {
    const leftX = Math.floor(x);
    const rightX = leftX + 1;
    const topY = Math.floor(y);
    const bottomY = topY + 1;
    let gradientIndexY, gradientIndex;

    gradientIndexY = PERMUTATION_TABLE[topY & 0xFF]; // top

    gradientIndex = PERMUTATION_TABLE[(gradientIndexY + leftX) & 0xFF]; // top left
    let ret = gradientDotWeighted(x - leftX, y - topY, this.gradX[gradientIndex], this.gradY[gradientIndex]);

    gradientIndex = PERMUTATION_TABLE[(gradientIndexY + rightX) & 0xFF]; // top right
    ret += gradientDotWeighted(x - rightX, y - topY, this.gradX[gradientIndex], this.gradY[gradientIndex]);

    gradientIndexY = PERMUTATION_TABLE[bottomY & 0xFF]; // bottom

    gradientIndex = PERMUTATION_TABLE[(gradientIndexY + leftX) & 0xFF]; // bottom left
    ret += gradientDotWeighted(x - leftX, y - bottomY, this.gradX[gradientIndex], this.gradY[gradientIndex]);

    gradientIndex = PERMUTATION_TABLE[(gradientIndexY + rightX) & 0xFF]; // bottom right
    ret += gradientDotWeighted(x - rightX, y - bottomY, this.gradX[gradientIndex], this.gradY[gradientIndex]);

    return ret;
  }
}
