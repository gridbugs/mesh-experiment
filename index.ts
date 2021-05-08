function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }
  const message = gl.getShaderInfoLog(shader);
  gl.deleteShader(shader);
  throw new Error(message);
}

function createShaderProgram(
  gl: WebGL2RenderingContext,
  shaders: {
    vertex: WebGLShader,
    fragment: WebGLShader,
  }
): WebGLProgram {
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, shaders.vertex);
  gl.attachShader(shaderProgram, shaders.fragment);
  gl.linkProgram(shaderProgram);
  if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    return shaderProgram;
  }
  const message = gl.getProgramInfoLog(shaderProgram);
  gl.deleteProgram(shaderProgram);
  throw new Error(message);
}

window.onload = () => {
  const canvas = document.querySelector('#c');
  if (canvas instanceof HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    const vertexShaderSource = `#version 300 es

      in vec3 a_position;

      void main() {
        gl_Position = vec4(a_position, 1.0);
      }
    `;
    const fragmentShaderSource = `#version 300 es

      precision highp float;

      out vec4 outColour;

      void main() {
        outColour = vec4(1.0, 0.0, 0.0, 1.0);
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
    const vertices = [
      -0.5, 0.5, 0.0,
      -0.5, -0.5, 0.0,
      0.5, -0.5, 0.0,
    ];
    const indices = [0, 1, 2];
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(shaderProgram, 'a_position');
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }
}
