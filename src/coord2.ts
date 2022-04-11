export class Coord2 {
  public constructor(public readonly x: number, public readonly y: number) {}

  public add(rhs: Coord2): Coord2 {
    return new Coord2(this.x + rhs.x, this.y + rhs.y);
  }

  public sub(rhs: Coord2): Coord2 {
    return new Coord2(this.x - rhs.x, this.y - rhs.y);
  }

  public neg(): Coord2 {
    return new Coord2(-this.x, -this.y);
  }

  public length(): number {
    return Math.sqrt((this.x * this.x) + (this.y * this.y));
  }

  public normalize(): Coord2 {
    if (this.x === 0 && this.y === 0) {
      throw new Error('can\'t normalize zero vector');
    }
    return this.scalarDiv(this.length());
  }

  public scalarMul(scalar: number): Coord2 {
    return new Coord2(this.x * scalar, this.y * scalar);
  }

  public scalarDiv(scalar: number): Coord2 {
    return new Coord2(this.x / scalar, this.y / scalar);
  }

  public angleRad(): number {
    return Math.atan2(this.y, this.x);
  }
}

export function c2(x: number, y: number): Coord2 {
  return new Coord2(x, y);
}
