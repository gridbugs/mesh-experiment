import { createShader, createShaderProgram } from './util';
import { Mesh3D } from '../mesh';
import { Matrix44 } from '../math';
import { PerlinNoise2D } from '../perlin_noise_2d';

type MountainsShaderProgram = {
  shaderProgram: WebGLProgram,
  attributeLocations: {
    position: number,
    colour: number,
  },
  uniformLocations: {
    transform: WebGLUniformLocation,
  }
};

type MountainsBuffers = {
  vertexBuffer: WebGLBuffer,
  colourBuffer: WebGLBuffer,
  indexBuffer: WebGLBuffer,
};

export type Mountains = MountainsShaderProgram & MountainsBuffers & { mesh: Mesh3D };

function createMountainShaderProgram(gl: WebGL2RenderingContext): MountainsShaderProgram {
  const vertexShaderSource = `#version 300 es

    in vec3 a_position;
    in vec3 a_colour;

    uniform mat4 u_transform;

    out vec3 v_colour;

    void main() {
      v_colour = a_colour;
      gl_Position = u_transform * vec4(a_position, 1);
    }
  `;
  const fragmentShaderSource = `#version 300 es

    precision highp float;

    in vec3 v_colour;

    out vec4 outColour;

    void main() {
      outColour = vec4(v_colour, 1.0);
    }
  `;
  const shaderProgram = createShaderProgram(gl, {
    vertex: createShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
    fragment: createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource),
  });
  const attributeLocations = {
    position: gl.getAttribLocation(shaderProgram, 'a_position'),
    colour: gl.getAttribLocation(shaderProgram, 'a_colour'),
  };
  const uTransform = gl.getUniformLocation(shaderProgram, 'u_transform');
  if (uTransform === null) {
    throw new Error('failed to get uniform location');
  }
  const uniformLocations = {
    transform: uTransform,
  };
  return { shaderProgram, attributeLocations, uniformLocations };
}

function createMountainBuffers(gl: WebGL2RenderingContext, mesh: Mesh3D, perlin: PerlinNoise2D): MountainsBuffers {
  const vertexBuffer = gl.createBuffer();
  if (vertexBuffer === null) {
    throw new Error('failed to create buffer');
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.yPlaneVertexBuffer(perlin), gl.STATIC_DRAW);
  const colourBuffer = gl.createBuffer();
  if (colourBuffer === null) {
    throw new Error('failed to create buffer');
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
  const colours = new Float32Array(mesh.numVertices() * 3);
  const heightNoiseZoom = 20;
  const colourNoiseZoom = 10;
  const snowLineZoom = 2;
  const snowZoom = 15;
  for (let i = 0; i < mesh.numVertexRows(); i += 1) {
    for (let j = 0; j < mesh.numVertexCols(); j += 1) {
      const height = perlin.noise01(j / heightNoiseZoom, i / heightNoiseZoom);
      const noiseR = perlin.noise01(42134 + j / colourNoiseZoom, 342452 + i / colourNoiseZoom);
      const noiseG = perlin.noise01(j / colourNoiseZoom, i / colourNoiseZoom);
      const noiseB = perlin.noise01(23423 + j / colourNoiseZoom, 4242341 + i / colourNoiseZoom);
      const noiseSnowLine = perlin.noise(9980980 + j / snowLineZoom, 76876 + i / snowLineZoom);
      const noiseSnow1 = perlin.noise01(74533 + j / snowZoom, 56452 + i / snowZoom);
      const noiseSnow2 = perlin.noise01(897987 + j / snowZoom, 342342 + i / snowZoom);
      const base = 3 * (i * mesh.numVertexCols() + j);
      if (height > (0.6 + noiseSnowLine * 0.1)) {
        colours[base + 0] = 0.7 + noiseSnow1 * 0.1;
        colours[base + 1] = 0.7 + noiseSnow1 * 0.1;
        colours[base + 2] = 0.8 + noiseSnow2 * 0.2;
      } else {
        colours[base + 0] = 0.1 + noiseR * 0.4;
        colours[base + 1] = 0.2 + noiseG * 0.5;
        colours[base + 2] = noiseB * 0.2;
      }
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, colours, gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer();
  if (indexBuffer === null) {
    throw new Error('failed to create buffer');
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    mesh.triangleIndexBuffer(),
    gl.STATIC_DRAW,
  );
  return { vertexBuffer, colourBuffer, indexBuffer };
}

export function createMountains(gl: WebGL2RenderingContext, perlin: PerlinNoise2D): Mountains {
  const mesh = new Mesh3D({
    cols: 200,
    rows: 200,
    x: -0.5,
    y: 0,
    z: -0.5,
    width: 1.0,
    height: 1.0,
  });
  return { ...createMountainShaderProgram(gl), ...createMountainBuffers(gl, mesh, perlin), mesh };
}

export function renderMountains(gl: WebGL2RenderingContext, mountains: Mountains, cameraTransform: Matrix44): void {
  const {
    shaderProgram, indexBuffer, vertexBuffer, colourBuffer, attributeLocations, uniformLocations, mesh
  } = mountains;
  gl.useProgram(shaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.enableVertexAttribArray(attributeLocations.position);
  gl.vertexAttribPointer(attributeLocations.position, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
  gl.vertexAttribPointer(attributeLocations.colour, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attributeLocations.colour);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.uniformMatrix4fv(uniformLocations.transform, false, cameraTransform.data);
  gl.drawElements(gl.TRIANGLES, mesh.triangleNumIndices(), gl.UNSIGNED_SHORT, 0);
}
