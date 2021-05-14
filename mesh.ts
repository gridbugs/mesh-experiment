function triangleIndexBuffer({ rows, cols }: { rows: number, cols: number }): number[] {
  const indices = [];
  const vertexCols = cols + 1;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const topLeft = (i * vertexCols) + j;

      // first triangle
      indices.push(topLeft);
      indices.push(topLeft + 1);
      indices.push(topLeft + vertexCols + 1);

      // second triangle
      indices.push(topLeft);
      indices.push(topLeft + vertexCols + 1);
      indices.push(topLeft + vertexCols);
    }
  }

  return indices;
}

function triangleNumIndices({ rows, cols }: { rows: number, cols: number }): number {
  return rows * cols * 6;
}

function lineStripIndexBuffer({ rows, cols }: { rows: number, cols: number }): number[] {
  const indices = [];
  const vertexCols = cols + 1;

  for (let i = 0; i < rows; i++) {

    // top line, left to right
    for (let j = 0; j < vertexCols; j++) {
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
  for (let j = 0; j < vertexCols; j++) {
    indices.push((rows * vertexCols) + j);
  }

  return indices;
}

function lineStripNumIndices({ rows, cols }: { rows: number, cols: number }): number {
  return (rows * (cols + 1)) + (cols * (rows + 1)) + (rows * cols);
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
): number[] {
  const vertices = [];

  const xStep = width / cols;
  const yStep = height / rows;

  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      vertices.push((j * xStep) + x);
      vertices.push((i * yStep) + y);
    }
  }

  return vertices;
}


function mesh2DNumVertices({ rows, cols }: { rows: number, cols: number }): number {
  return (rows + 1) * (cols + 1);
}

type Mesh2DProps = {
  rows: number,
  cols: number,
  x: number,
  y: number,
  width: number,
  height: number,
};


export class Mesh2D {
  private readonly props: Mesh2DProps;

  public constructor(props: Mesh2DProps) {
    this.props = props;
  }

  triangleIndexBuffer(): number[] {
    return triangleIndexBuffer({ rows: this.props.rows, cols: this.props.cols });
  }

  triangleNumIndices(): number {
    return triangleNumIndices({ rows: this.props.rows, cols: this.props.cols });
  }

  lineStripIndexBuffer(): number[] {
    return lineStripIndexBuffer({ rows: this.props.rows, cols: this.props.cols });
  }

  lineStripNumIndices(): number {
    return lineStripNumIndices({ rows: this.props.rows, cols: this.props.cols });
  }

  vertexBuffer(): number[] {
    return mesh2DVertexBuffer(this.props);
  }

  numVertices(): number {
    return mesh2DNumVertices({ rows: this.props.rows, cols: this.props.cols });
  }
}
