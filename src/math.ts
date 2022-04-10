// This file stores matrices in column-major order for consistency with opengl.

function matrix44Multiply(out: Float32Array, a: Float32Array, b: Float32Array): void {
  const a00 = a[0];
  const a10 = a[1];
  const a20 = a[2];
  const a30 = a[3];
  const a01 = a[4];
  const a11 = a[5];
  const a21 = a[6];
  const a31 = a[7];
  const a02 = a[8];
  const a12 = a[9];
  const a22 = a[10];
  const a32 = a[11];
  const a03 = a[12];
  const a13 = a[13];
  const a23 = a[14];
  const a33 = a[15];

  let b0 = b[0];
  let b1 = b[1];
  let b2 = b[2];
  let b3 = b[3];
  out[0] = (a00 * b0) + (a01 * b1) + (a02 * b2) + (a03 * b3);
  out[1] = (a10 * b0) + (a11 * b1) + (a12 * b2) + (a13 * b3);
  out[2] = (a20 * b0) + (a21 * b1) + (a22 * b2) + (a23 * b3);
  out[3] = (a30 * b0) + (a31 * b1) + (a32 * b2) + (a33 * b3);

  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = (a00 * b0) + (a01 * b1) + (a02 * b2) + (a03 * b3);
  out[5] = (a10 * b0) + (a11 * b1) + (a12 * b2) + (a13 * b3);
  out[6] = (a20 * b0) + (a21 * b1) + (a22 * b2) + (a23 * b3);
  out[7] = (a30 * b0) + (a31 * b1) + (a32 * b2) + (a33 * b3);

  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = (a00 * b0) + (a01 * b1) + (a02 * b2) + (a03 * b3);
  out[9] = (a10 * b0) + (a11 * b1) + (a12 * b2) + (a13 * b3);
  out[10] = (a20 * b0) + (a21 * b1) + (a22 * b2) + (a23 * b3);
  out[11] = (a30 * b0) + (a31 * b1) + (a32 * b2) + (a33 * b3);

  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = (a00 * b0) + (a01 * b1) + (a02 * b2) + (a03 * b3);
  out[13] = (a10 * b0) + (a11 * b1) + (a12 * b2) + (a13 * b3);
  out[14] = (a20 * b0) + (a21 * b1) + (a22 * b2) + (a23 * b3);
  out[15] = (a30 * b0) + (a31 * b1) + (a32 * b2) + (a33 * b3);
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
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = dx;
  out[13] = dy;
  out[14] = dz;
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
  out[10] = sz;
  out[11] = 0;
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

function matrix44RotateX(out: Float32Array, radians: number): void {
  const s = Math.sin(radians);
  const c = Math.cos(radians);
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = c;
  out[6] = s;
  out[7] = 0;
  out[8] = 0;
  out[9] = -s;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
}

function matrix44RotateY(out: Float32Array, radians: number): void {
  const s = Math.sin(radians);
  const c = Math.cos(radians);
  out[0] = c;
  out[1] = 0;
  out[2] = -s;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = s;
  out[9] = 0;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
}

function matrix44RotateZ(out: Float32Array, radians: number): void {
  const s = Math.sin(radians);
  const c = Math.cos(radians);
  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = 0;
  out[4] = -s;
  out[5] = c;
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
  out[14] = 2 * far * near * nf;
  out[15] = 0;
}

function vector3Add(out: Float32Array, a: Float32Array, b: Float32Array): void {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
}

function vector4MultiplyMatrix44(outVector: Float32Array, lhsMatrix: Float32Array, rhsVector: Float32Array): void {
  const rhsVector0 = rhsVector[0];
  const rhsVector1 = rhsVector[1];
  const rhsVector2 = rhsVector[2];
  const rhsVector3 = rhsVector[3];
  outVector[0] = (lhsMatrix[0] * rhsVector0)
    + (lhsMatrix[4] * rhsVector1)
    + (lhsMatrix[8] * rhsVector2)
    + (lhsMatrix[12] * rhsVector3);
  outVector[1] = (lhsMatrix[1] * rhsVector0)
    + (lhsMatrix[5] * rhsVector1)
    + (lhsMatrix[9] * rhsVector2)
    + (lhsMatrix[13] * rhsVector3);
  outVector[2] = (lhsMatrix[2] * rhsVector0)
    + (lhsMatrix[6] * rhsVector1)
    + (lhsMatrix[10] * rhsVector2)
    + (lhsMatrix[14] * rhsVector3);
  outVector[3] = (lhsMatrix[3] * rhsVector0)
    + (lhsMatrix[7] * rhsVector1)
    + (lhsMatrix[11] * rhsVector2)
    + (lhsMatrix[15] * rhsVector3);
}

export class Matrix44 {
  public readonly data: Float32Array;

  public constructor() {
    this.data = new Float32Array(16);
  }

  public setIdentity(): Matrix44 {
    matrix44Identity(this.data);
    return this;
  }

  public setTranslation(dx: number, dy: number, dz: number): Matrix44 {
    matrix44Translation(this.data, dx, dy, dz);
    return this;
  }

  public setTranslationByVector3(vector3: Vector3): Matrix44 {
    this.setTranslation(vector3.x(), vector3.y(), vector3.z());
    return this;
  }

  public setScale(sx: number, sy: number, sz: number): Matrix44 {
    matrix44Scale(this.data, sx, sy, sz);
    return this;
  }

  public setAlign(unitVectorToAlign: Vector3, unitVectorToAlignTo: Vector3): Matrix44 {
    matrix44Align(this.data, unitVectorToAlign.data, unitVectorToAlignTo.data);
    return this;
  }

  public setRotateX(radians: number): Matrix44 {
    matrix44RotateX(this.data, radians);
    return this;
  }

  public setRotateY(radians: number): Matrix44 {
    matrix44RotateY(this.data, radians);
    return this;
  }

  public setRotateZ(radians: number): Matrix44 {
    matrix44RotateZ(this.data, radians);
    return this;
  }

  public setProject(fovyRadians: number, aspect: number, near: number, far: number): Matrix44 {
    matrix44Project(this.data, fovyRadians, aspect, near, far);
    return this;
  }

  public setMultiply(lhs: Matrix44, rhs: Matrix44): Matrix44 {
    matrix44Multiply(this.data, lhs.data, rhs.data);
    return this;
  }

  public pretty(): string {
    return `${this.data[0]} ${this.data[4]} ${this.data[8]} ${this.data[12]}
${this.data[1]} ${this.data[5]} ${this.data[9]} ${this.data[13]}
${this.data[2]} ${this.data[6]} ${this.data[10]} ${this.data[14]}
${this.data[3]} ${this.data[7]} ${this.data[11]} ${this.data[15]}`;
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

  public setX(x: number): Vector3 {
    this.data[0] = x;
    return this;
  }

  public setY(y: number): Vector3 {
    this.data[1] = y;
    return this;
  }

  public setZ(z: number): Vector3 {
    this.data[2] = z;
    return this;
  }

  public set(x: number, y: number, z: number): Vector3 {
    this.data[0] = x;
    this.data[1] = y;
    this.data[2] = z;
    return this;
  }

  public setAdd(a: Vector3, b: Vector3): Vector3 {
    vector3Add(this.data, a.data, b.data);
    return this;
  }

  public setHomogenousFromVector4(vector4: Vector4): Vector3 {
    const norm = 1 / vector4.w();
    this.setX(vector4.x() * norm);
    this.setY(vector4.y() * norm);
    this.setZ(vector4.z() * norm);
    return this;
  }
}

export class Vector4 {
  public readonly data: Float32Array;

  public constructor(x: number, y: number, z: number, w: number) {
    const data = new Float32Array(4);
    data[0] = x;
    data[1] = y;
    data[2] = z;
    data[3] = w;
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

  public w(): number {
    return this.data[3];
  }

  public setX(x: number): Vector4 {
    this.data[0] = x;
    return this;
  }

  public setY(y: number): Vector4 {
    this.data[1] = y;
    return this;
  }

  public setZ(z: number): Vector4 {
    this.data[2] = z;
    return this;
  }

  public setW(w: number): Vector4 {
    this.data[3] = w;
    return this;
  }

  public set(x: number, y: number, z: number, w: number): Vector4 {
    this.data[0] = x;
    this.data[1] = y;
    this.data[2] = z;
    this.data[3] = w;
    return this;
  }

  public setHomogenousFromVector3(vector3: Vector3): Vector4 {
    this.setX(vector3.x());
    this.setY(vector3.y());
    this.setZ(vector3.z());
    this.setW(1);
    return this;
  }

  public setMultiplyMatrix44(matrix44: Matrix44, vector4: Vector4): Vector4 {
    vector4MultiplyMatrix44(this.data, matrix44.data, vector4.data);
    return this;
  }
}

export function deg2rad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
