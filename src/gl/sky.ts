import { createShader, createShaderProgram } from './util';

export type Sky = SkyShaderProgram & SkyBuffers;

type SkyShaderProgram = {
  shaderProgram: WebGLProgram,
  attributeLocations: {
    position: number,
  }
};

type SkyBuffers = {
  vertexBuffer: WebGLBuffer,
  indexBuffer: WebGLBuffer,
}

function createSkyShaderProgram(gl: WebGL2RenderingContext): SkyShaderProgram {
  const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0, 1);
    }
  `;

  const fragmentShaderSource = `#version 300 es
    precision highp float;
    out vec4 outColour;
    void main() {
      outColour = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `;
  const shaderProgram = createShaderProgram(gl, {
    vertex: createShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
    fragment: createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource),
  });
  const attributeLocations = {
    position: gl.getAttribLocation(shaderProgram, 'a_position'),
  };
  return { shaderProgram, attributeLocations };
}

function createSkyBuffers(gl: WebGL2RenderingContext): SkyBuffers {
  const vertexBuffer = gl.createBuffer();
  if (vertexBuffer === null) {
    throw new Error('failed to create buffer');
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, 1, 1, 1, 0, -1, 0]), gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer();
  if (indexBuffer === null) {
    throw new Error('failed to create buffer');
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Int16Array([0, 2, 1, 0, 3, 2]),
    gl.STATIC_DRAW,
  );
  return { vertexBuffer, indexBuffer };
}

export function createSky(gl: WebGL2RenderingContext): Sky {
  return { ...createSkyShaderProgram(gl), ...createSkyBuffers(gl) };
}

export function renderSky(gl: WebGL2RenderingContext, sky: Sky): void {
  gl.useProgram(sky.shaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, sky.vertexBuffer);
  gl.enableVertexAttribArray(sky.attributeLocations.position);
  gl.vertexAttribPointer(sky.attributeLocations.position, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sky.indexBuffer);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}
