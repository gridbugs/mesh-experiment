import { Mesh2D } from './mesh';
import { Matrix44, Vector3 } from './math';

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

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
}

window.onload = () => {
  const canvas = document.querySelector('#c');
  if (canvas instanceof HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    if (gl === null) {
      throw new Error("failed to create webgl2 context");
    }
    const vertexShaderSource = `#version 300 es

      in vec2 a_position;
      in vec3 a_colour;

      out vec3 v_colour;

      void main() {
        v_colour = a_colour;
        gl_Position = vec4(a_position, 0.0, 1.0);
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

    const mesh = new Mesh2D({
      cols: 20,
      rows: 10,
      x: -0.1,
      y: -0.5,
      width: 1.0,
      height: 1.0,
    });

    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertexBuffer(), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const colourAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_colour');
    const colourBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
    const colours = new Float32Array(Array.apply(null, Array(mesh.numVertices())).flatMap((_: any) => [1.0, 0.0, 0.0]));
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

    //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    resizeCanvasToDisplaySize(canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shaderProgram);
    gl.drawElements(gl.LINE_STRIP, mesh.lineStripNumIndices(), gl.UNSIGNED_SHORT, 0);
    //gl.drawElements(gl.TRIANGLES, mesh.triangleNumIndices(), gl.UNSIGNED_SHORT, 0);
  }
}
