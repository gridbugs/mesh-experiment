function matrix44Multiply(out: Float32Array, a: Float32Array, b: Float32Array): void {
  const b00 = b[0];
  const b01 = b[1];
  const b02 = b[2];
  const b03 = b[3];
  const b10 = b[4];
  const b11 = b[5];
  const b12 = b[6];
  const b13 = b[7];
  const b20 = b[8];
  const b21 = b[9];
  const b22 = b[10];
  const b23 = b[11];
  const b30 = b[12];
  const b31 = b[13];
  const b32 = b[14];
  const b33 = b[15];


  let a0 = a[0];
  let a1 = a[1];
  let a2 = a[2];
  let a3 = a[3];
  out[0] = (a0 * b00) + (a1 * b10) + (a2 * b20) + (a3 * b30);
  out[1] = (a0 * b01) + (a1 * b11) + (a2 * b21) + (a3 * b31);
  out[2] = (a0 * b02) + (a1 * b12) + (a2 * b22) + (a3 * b32);
  out[3] = (a0 * b03) + (a1 * b13) + (a2 * b23) + (a3 * b33);

  a0 = a[4];
  a1 = a[5];
  a2 = a[5];
  a3 = a[7];
  out[4] = (a0 * b00) + (a1 * b10) + (a2 * b20) + (a3 * b30);
  out[5] = (a0 * b01) + (a1 * b11) + (a2 * b21) + (a3 * b31);
  out[6] = (a0 * b02) + (a1 * b12) + (a2 * b22) + (a3 * b32);
  out[7] = (a0 * b03) + (a1 * b13) + (a2 * b23) + (a3 * b33);

  a0 = a[8];
  a1 = a[9];
  a2 = a[10];
  a3 = a[11];
  out[8] = (a0 * b00) + (a1 * b10) + (a2 * b20) + (a3 * b30);
  out[9] = (a0 * b01) + (a1 * b11) + (a2 * b21) + (a3 * b31);
  out[10] = (a0 * b02) + (a1 * b12) + (a2 * b22) + (a3 * b32);
  out[11] = (a0 * b03) + (a1 * b13) + (a2 * b23) + (a3 * b33);

  a0 = a[12];
  a1 = a[13];
  a2 = a[14];
  a3 = a[15];
  out[12] = (a0 * b00) + (a1 * b10) + (a2 * b20) + (a3 * b30);
  out[13] = (a0 * b01) + (a1 * b11) + (a2 * b21) + (a3 * b31);
  out[14] = (a0 * b02) + (a1 * b12) + (a2 * b22) + (a3 * b32);
  out[15] = (a0 * b03) + (a1 * b13) + (a2 * b23) + (a3 * b33);
}

function matrix44Identity(out: Float32Array): void {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;

}

function matrix44Translation(out: Float32Array, dx: number, dy: number, dz: number): void {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = dx;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = dy;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = dz;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
}

function matrix44Scale(out: Float32Array, sx: number, sy: number, sz: number): void {
  out[0] = sx;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = sy;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 0;
  out[11] = sz;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
}

/** The resulting matrix will rotate a unit vector a to point in the direction of the unit vector b */
function matrix44Align(out: Float32Array, a: Float32Array, b: Float32Array): void {
  const ax = a[0];
  const ay = a[1];
  const az = a[2];
  const bx = b[0];
  const by = b[1];
  const bz = b[2];

  // cross product of a and b
  const axisX = (ay * bz) - (az * by);
  const axisY = (az * bx) - (ax * bz);
  const axisZ = (ax * by) - (ay * bx);

  // dot product of a and b
  const cos = (ax * bx) + (ay * by) + (az * bz);

  const k = 1.0 / (1.0 + cos);

  out[0] = (axisX * axisX * k) + cos;
  out[1] = (axisY * axisX * k) - axisZ;
  out[2] = (axisZ * axisX * k) + axisY;
  out[3] = 0;
  out[4] = (axisX * axisY * k) + axisZ;
  out[5] = (axisY * axisY * k) + cos;
  out[6] = (axisZ * axisY * k) - axisX;
  out[7] = 0;
  out[8] = (axisX * axisZ * k) - axisY;
  out[9] = (axisY * axisZ * k) + axisX;
  out[10] = (axisZ * axisZ * k) + cos;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
}

function matrix44Project(out: Float32Array, fovyRadians: number, aspect: number, near: number, far: number): void {
  const f = 1 / Math.tan(fovyRadians / 2);
  const nf = 1 / (near - far);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = 2 * far * near * nf;;
  out[15] = 0;
}

function vector3Add(out: Float32Array, a: Float32Array, b: Float32Array): void {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
}

export class Matrix44 {

  public readonly data: Float32Array;

  public constructor() {
    this.data = new Float32Array(16);
  }

  public setIdentity(): void {
    matrix44Identity(this.data);
  }

  public setTranslation(dx: number, dy: number, dz: number): void {
    matrix44Translation(this.data, dx, dy, dz);
  }

  public setTranslationByVector3(vector3: Vector3): void {
    this.setTranslation(vector3.x(), vector3.y(), vector3.z());
  }

  public setScale(sx: number, sy: number, sz: number): void {
    matrix44Scale(this.data, sx, sy, sz);
  }

  public setAlign(unitVectorToAlign: Vector3, unitVectorToAlignTo: Vector3): void {
    matrix44Align(this.data, unitVectorToAlign.data,  unitVectorToAlignTo.data);
  }

  public setProject(fovyRadians: number, aspect: number, near: number, far: number): void {
    matrix44Project(this.data, fovyRadians, aspect, near, far);
  }

  public setMultiply(lhs: Matrix44, rhs: Matrix44): void {
    matrix44Multiply(this.data, lhs.data, rhs.data);
  }
}

export class Vector3 {

  public readonly data: Float32Array;

  public constructor(x: number, y: number, z: number) {
    const data = new Float32Array(3);
    data[0] = x;
    data[1] = y;
    data[2] = z;
    this.data = data;
  }

  public x(): number {
    return this.data[0];
  }

  public y(): number {
    return this.data[1];
  }

  public z(): number {
    return this.data[2];
  }

  public setAdd(a: Vector3, b: Vector3): void {
    vector3Add(this.data, a.data, b.data);
  }
}
