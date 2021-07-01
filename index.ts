import { Mesh3D } from './mesh';
import { Matrix44, Vector3, Vector4, deg2rad } from './math';
import { XorShiftRng } from './xor_shift_rng';
import { PerlinNoise2D } from './perlin_noise_2d';

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (shader === null) {
    throw new Error("failed to create shader");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }
  const message = gl.getShaderInfoLog(shader);
  gl.deleteShader(shader);
  throw new Error("failed to compile shader: " + message);
}

function createShaderProgram(
  gl: WebGL2RenderingContext,
  shaders: {
    vertex: WebGLShader,
    fragment: WebGLShader,
  }
): WebGLProgram {
  const shaderProgram = gl.createProgram();
  if (shaderProgram === null) {
    throw new Error("failed to create shader program");
  }
  gl.attachShader(shaderProgram, shaders.vertex);
  gl.attachShader(shaderProgram, shaders.fragment);
  gl.linkProgram(shaderProgram);
  if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    return shaderProgram;
  }
  const message = gl.getProgramInfoLog(shaderProgram);
  gl.deleteProgram(shaderProgram);
  throw new Error("failed to link program:" + message);
}

function runDemo() {
  const canvas = document.querySelector('#c');
  if (canvas instanceof HTMLCanvasElement) {
    const maybeGl = canvas.getContext('webgl2');
    if (maybeGl === null) {
      throw new Error("failed to create webgl2 context");
    }
    const gl: WebGL2RenderingContext = maybeGl;

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
    const shaderProgram = createShaderProgram(
      gl,
      {
        vertex: createShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
        fragment: createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource),
      }
    );
    gl.useProgram(shaderProgram);

    const perlin = new PerlinNoise2D(XorShiftRng.withRandomSeed());

    const mesh = new Mesh3D({
      cols: 200,
      rows: 200,
      x: -0.5,
      y: 0,
      z: -0.5,
      width: 1.0,
      height: 1.0,
    });

    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.yPlaneVertexBuffer(perlin), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    const colourAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_colour');
    const colourBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
    const colours = new Float32Array(mesh.numVertices() * 3);
    const heightNoiseZoom = 20;
    const colourNoiseZoom = 10;
    const snowLineZoom = 2;
    for (let i = 0; i < mesh.numVertexRows(); i++) {
      for (let j = 0; j < mesh.numVertexCols(); j++) {
        const height = (1 + perlin.noise(j / heightNoiseZoom, i / heightNoiseZoom)) / 2;
        const noiseR = (1 + perlin.noise(42134 + j / colourNoiseZoom, 342452 + i / colourNoiseZoom)) / 2;
        const noiseG = (1 + perlin.noise(j / colourNoiseZoom, i / colourNoiseZoom)) / 2;
        const noiseB = (1 + perlin.noise(23423 + j / colourNoiseZoom, 4242341 + i / colourNoiseZoom)) / 2;
        const noiseSnow = perlin.noise(9980980 + j / snowLineZoom, 76876 + i / snowLineZoom)
        const base = 3 * (i * mesh.numVertexCols() + j);
        if (height > (0.6 + noiseSnow * 0.1)) {
          colours[base + 0] = 1;
          colours[base + 1] = 1;
          colours[base + 2] = 1;
        } else {
          colours[base + 0] = 0.1 + noiseR * 0.4;
          colours[base + 1] = 0.2 + noiseG * 0.5;
          colours[base + 2] = noiseB * 0.2;
        }
      }
    }

    gl.bufferData(gl.ARRAY_BUFFER, colours, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colourAttributeLocation);
    gl.vertexAttribPointer(colourAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      mesh.triangleIndexBuffer(),
      gl.STATIC_DRAW,
    );

    const indexBufferWireframe = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferWireframe);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      mesh.lineStripIndexBuffer(),
      gl.STATIC_DRAW,
    );

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    let count = 0;

    const intrinsic = new Matrix44().setProject(deg2rad(90), 1, 0.1, 10000);
    const extrinsic = new Matrix44();
    const translate = new Matrix44().setIdentity();
    translate.setMultiply(translate, new Matrix44().setScale(4000, 500, 4000));
    const rotate = new Matrix44();

    const transform = new Matrix44();
    const transformUniformLocation = gl.getUniformLocation(shaderProgram, 'u_transform');


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    function draw() {
      extrinsic.setMultiply(translate, rotate.setRotateY(deg2rad(count * 0.1)))
        .setMultiply(rotate.setTranslation(0, -160, 0), extrinsic);
      transform.setMultiply(intrinsic, extrinsic);

      gl.uniformMatrix4fv(transformUniformLocation, false, transform.data);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //gl.drawElements(gl.LINE_STRIP, mesh.lineStripNumIndices(), gl.UNSIGNED_SHORT, 0);
      gl.drawElements(gl.TRIANGLES, mesh.triangleNumIndices(), gl.UNSIGNED_SHORT, 0);
      count += 1;

      requestAnimationFrame(draw);
    }

    draw();
  }
}

window.onload = runDemo;
