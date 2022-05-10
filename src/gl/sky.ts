import { createShader, createShaderProgram } from './util';
import { XorShiftRng } from '../xor_shift_rng';
import { PERMUTATION_TABLE, createGradTables } from '../perlin_noise_2d';

export const SKY_COLOUR = {
  r: 0x94 / 0xff,
  g: 0xb3 / 0xff,
  b: 0xff / 0xff,
};

type SkyShaderProgram = {
  shaderProgram: WebGLProgram,
  attributeLocations: {
    position: number,
  }
};

type SkyBuffers = {
  vertexBuffer: WebGLBuffer,
  indexBuffer: WebGLBuffer,
};

export type Sky = SkyShaderProgram & SkyBuffers;

function createSkyShaderProgram(gl: WebGL2RenderingContext, rng: XorShiftRng): SkyShaderProgram {
  const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    out vec2 v_position;
    void main() {
      v_position = a_position;
      gl_Position = vec4(a_position, 0, 1);
    }
  `;

  const { x: gradX, y: gradY } = createGradTables(rng);
  function formatFloat(f: number): string {
    if (f === Math.floor(f)) {
      return `${f}.0f`;
    }
    return `${f}f`;
  }

  const fragmentShaderSource = `#version 300 es
    precision lowp float;

    const int PERMUTATION_TABLE[256] = int[256](${Array.from(PERMUTATION_TABLE).map((i) => `${i}`).join(', ')});

    const float GRAD_TABLE_X[256] = float[256](${Array.from(gradX).map(formatFloat).join(', ')});
    const float GRAD_TABLE_Y[256] = float[256](${Array.from(gradY).map(formatFloat).join(', ')});

    float smootherstep(float w) {
      return (w * (w * 6.0 - 15.0) + 10.0) * w * w * w;
    }

    float gradientDotWeighted(float offsetX, float offsetY, float gradientX, float gradientY) {
      return smootherstep(1.0 - abs(offsetX))
        * smootherstep(1.0 - abs(offsetY))
        * ((gradientX * offsetX) + (gradientY * offsetY));
    }

    float noise(float x, float y) {
      int leftX = int(floor(x));
      int rightX = leftX + 1;
      int topY = int(floor(y));
      int bottomY = topY + 1;
      int gradientIndexY;
      int gradientIndex;
      float ret;

      gradientIndexY = PERMUTATION_TABLE[topY & 0xFF];

      gradientIndex = PERMUTATION_TABLE[(gradientIndexY + leftX) & 0xFF]; // top left
      ret = gradientDotWeighted(
        x - float(leftX),
        y - float(topY),
        GRAD_TABLE_X[gradientIndex],
        GRAD_TABLE_Y[gradientIndex]
      );

      gradientIndex = PERMUTATION_TABLE[(gradientIndexY + rightX) & 0xFF]; // top right
      ret += gradientDotWeighted(
        x - float(rightX),
        y - float(topY),
        GRAD_TABLE_X[gradientIndex],
        GRAD_TABLE_Y[gradientIndex]
      );

      gradientIndexY = PERMUTATION_TABLE[bottomY & 0xFF];

      gradientIndex = PERMUTATION_TABLE[(gradientIndexY + leftX) & 0xFF]; // bottom left
      ret += gradientDotWeighted(
        x - float(leftX),
        y - float(bottomY),
        GRAD_TABLE_X[gradientIndex],
        GRAD_TABLE_Y[gradientIndex]
      );

      gradientIndex = PERMUTATION_TABLE[(gradientIndexY + rightX) & 0xFF]; // bottom right
      ret += gradientDotWeighted(
        x - float(rightX),
        y - float(bottomY),
        GRAD_TABLE_X[gradientIndex],
        GRAD_TABLE_Y[gradientIndex]
      );

      return ret;
    }

    float noise01(vec2 coord) {
      return (1.0f + noise(coord.x, coord.y)) / 2.0f;
    }

    vec2 rotate(float by, vec2 v) {
      float newAngle = atan(v.y, v.x) + by;
      float distance = length(v);
      return length(v) * vec2(cos(newAngle), sin(newAngle));
    }

    vec2 screenCoordToSkyCoord(float focalLength, float skyHeight, float horizDrop, vec2 screenCoord) {
      return (skyHeight / (screenCoord.y + horizDrop)) * vec2(screenCoord.x, focalLength);
    }

    vec3 screenCoordToSkyColour(vec2 screenCoord) {
      vec2 sampleCoordHighCloud = 0.05f * rotate(0.0f, screenCoordToSkyCoord(1.0f, 100.0f, 0.0f, screenCoord));
      float noiseHighCloud = noise01(sampleCoordHighCloud);
      float noiseLowCloud = noise01(sampleCoordHighCloud);
      float noiseVeryLowCloud = 0.0f; //noise01(sampleCoordHighCloud);

      float n = 0.9f * pow(noiseHighCloud, 6.0f) + 1.2 * pow(noiseLowCloud, 1.0f) + 0.6 * pow(noiseVeryLowCloud, 1.0f);
      float c = n * pow(screenCoord.y, 0.6f) + (1.0f - pow(screenCoord.y, 0.3f)) * 0.5f;
      return vec3(0.3f + 0.7f * c, c * 0.5f + 0.5f, 1.0f);
    }

    in vec2 v_position;
    out vec4 outColour;
    void main() {
      vec3 skyColour = screenCoordToSkyColour(v_position);
      outColour = vec4(skyColour, 1.0);
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

export function createSky(gl: WebGL2RenderingContext, rng: XorShiftRng): Sky {
  return { ...createSkyShaderProgram(gl, rng), ...createSkyBuffers(gl) };
}

export function renderSky(gl: WebGL2RenderingContext, sky: Sky): void {
  const {
    shaderProgram, indexBuffer, vertexBuffer, attributeLocations
  } = sky;
  gl.useProgram(shaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.enableVertexAttribArray(attributeLocations.position);
  gl.vertexAttribPointer(attributeLocations.position, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}
