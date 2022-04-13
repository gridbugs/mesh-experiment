export function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (shader === null) {
    throw new Error('failed to create shader');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }
  const message = gl.getShaderInfoLog(shader);
  gl.deleteShader(shader);
  throw new Error(`failed to compile shader: ${message}`);
}

export function createShaderProgram(
  gl: WebGL2RenderingContext,
  shaders: {
    vertex: WebGLShader,
    fragment: WebGLShader,
  }
): WebGLProgram {
  const shaderProgram = gl.createProgram();
  if (shaderProgram === null) {
    throw new Error('failed to create shader program');
  }
  gl.attachShader(shaderProgram, shaders.vertex);
  gl.attachShader(shaderProgram, shaders.fragment);
  gl.linkProgram(shaderProgram);
  if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    return shaderProgram;
  }
  const message = gl.getProgramInfoLog(shaderProgram);
  gl.deleteProgram(shaderProgram);
  throw new Error(`failed to link program:${message}`);
}
