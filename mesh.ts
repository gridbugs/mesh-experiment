import { PerlinNoise2D } from './perlin_noise_2d';

function triangleIndexBuffer({ rows, cols }: { rows: number, cols: number }): Uint16Array {
  const indices = [];
  const vertexCols = cols + 1;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const topLeft = (i * vertexCols) + j;

      // first triangle
      indices.push(topLeft);
      indices.push(topLeft + vertexCols + 1);
      indices.push(topLeft + 1);

      // second triangle
      indices.push(topLeft);
      indices.push(topLeft + vertexCols);
      indices.push(topLeft + vertexCols + 1);
    }
  }

  return new Uint16Array(indices);
}

function triangleNumIndices({ rows, cols }: { rows: number, cols: number }): number {
  return rows * cols * 6;
}

function lineStripIndexBuffer({ rows, cols }: { rows: number, cols: number }): Uint16Array {
  const indices = [];
  const vertexCols = cols + 1;

  indices.push(0);

  for (let i = 0; i < rows; i++) {

    // top line, left to right
    for (let j = 1; j < vertexCols; j++) {
      indices.push((i * vertexCols) + j);
    }

    // zig-zag back, right to left
    for (let j = cols - 1; j >= 0; j--) {
      indices.push((i * vertexCols) + j + 1 + vertexCols);  // down
      indices.push((i * vertexCols) + j);  // up, left
    }

    // final down stroke on the far left
    indices.push((i * vertexCols) + vertexCols);
  }

  // bottom row, left to right
  for (let j = 1; j < vertexCols; j++) {
    indices.push((rows * vertexCols) + j);
  }

  return new Uint16Array(indices);
}

function lineStripNumIndices({ rows, cols }: { rows: number, cols: number }): number {
  return 1 + (rows * (cols + 1)) + (cols * (rows + 1)) + (rows * cols);
}

function mesh2DVertexBuffer(
  { rows, cols, x, y, width, height }: {
    rows: number,
    cols: number,
    x: number,
    y: number,
    width: number,
    height: number,
  }
): Float32Array {
  const vertices = [];

  const xStep = width / cols;
  const yStep = height / rows;

  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      vertices.push((j * xStep) + x);
      vertices.push((i * yStep) + y);
    }
  }

  return new Float32Array(vertices);
}


function meshNumVertices({ rows, cols }: { rows: number, cols: number }): number {
  return (rows + 1) * (cols + 1);
}

function mesh3DYPlaneVertexBuffer(
  { rows, cols, x, y, z, width, height }: {
    rows: number,
    cols: number,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
  },
  perlin: PerlinNoise2D,
): Float32Array {
  const vertices = [];

  const xStep = width / cols;
  const zStep = height / rows;
  const noiseZoom = 20;

  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const perturbedY = y + perlin.noise(j / noiseZoom, i / noiseZoom);
      vertices.push((j * xStep) + x);
      vertices.push(perturbedY);
      vertices.push((i * zStep) + z);
    }
  }

  return new Float32Array(vertices);
}

type Mesh2DProps = {
  rows: number,
  cols: number,
  x: number,
  y: number,
  width: number,
  height: number,
};

class Mesh<P extends { rows: number, cols: number }> {
  protected readonly props: P;

  public constructor(props: P) {
    this.props = props;
  }

  public triangleIndexBuffer(): Uint16Array {
    return triangleIndexBuffer(this.props);
  }

  public triangleNumIndices(): number {
    return triangleNumIndices(this.props);
  }

  public lineStripIndexBuffer(): Uint16Array {
    return lineStripIndexBuffer(this.props);
  }

  public lineStripNumIndices(): number {
    return lineStripNumIndices(this.props);
  }

  public numVertices(): number {
    return meshNumVertices(this.props);
  }

  public numVertexRows(): number {
    return this.props.rows + 1;
  }

  public numVertexCols(): number {
    return this.props.cols + 1;
  }
}

export class Mesh2D extends Mesh<Mesh2DProps> {

  public constructor(props: Mesh2DProps) {
    super(props);
  }

  vertexBuffer(): Float32Array {
    return mesh2DVertexBuffer(this.props);
  }
}

type Mesh3DProps = {
  rows: number,
  cols: number,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
};

export class Mesh3D extends Mesh<Mesh3DProps> {

  public constructor(props: Mesh3DProps) {
    super(props);
  }

  yPlaneVertexBuffer(perlin: PerlinNoise2D): Float32Array {
    return mesh3DYPlaneVertexBuffer(this.props, perlin);
  }
}
