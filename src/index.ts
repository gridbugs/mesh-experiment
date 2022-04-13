/* eslint-disable */
import { Mesh3D } from './mesh';
import { Coord2, c2 } from './coord2';
import {
  Matrix44, Vector3, Vector4, deg2rad
} from './math';
import { XorShiftRng } from './xor_shift_rng';
import { PerlinNoise2D } from './perlin_noise_2d';
import { createShader, createShaderProgram } from './gl/util';
import { createSky, renderSky } from './gl/sky';

function getCanvasWebgl2(elementId: string): [HTMLCanvasElement, WebGL2RenderingContext] {
  const canvas = document.getElementById(elementId);
  if (canvas instanceof HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    if (gl === null) {
      throw new Error('failed to create webgl2 context');
    }
    return [canvas, gl];
  } else {
    throw new Error(`${elementId} doesn't refer to canvas element`);
  }
}

function getCanvas2d(elementId: string): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.getElementById(elementId);
  if (canvas instanceof HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      throw new Error('failed to create 2d context');
    }
    return [canvas, ctx];
  } else {
    throw new Error(`${elementId} doesn't refer to canvas element`);
  }
}

function runDemo() {
  const [_, gl] = getCanvasWebgl2('c');

  const sky = createSky(gl);

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

  function drawMountains() {
    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
    gl.vertexAttribPointer(colourAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colourAttributeLocation);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    extrinsic.setMultiply(translate, rotate.setRotateY(deg2rad(count * 0.1)))
      .setMultiply(rotate.setTranslation(0, -160, 0), extrinsic);
    transform.setMultiply(intrinsic, extrinsic);

    gl.uniformMatrix4fv(transformUniformLocation, false, transform.data);

    gl.drawElements(gl.TRIANGLES, mesh.triangleNumIndices(), gl.UNSIGNED_SHORT, 0);
  }

  function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderSky(gl, sky);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    drawMountains();
    count += 1;
    requestAnimationFrame(draw);
  }

  draw();
}

function perlinTest() {
  const perlin = new PerlinNoise2D(XorShiftRng.withRandomSeed());

  const canvas = document.querySelector('#c_');
  if (canvas instanceof HTMLCanvasElement) {
    const maybeCtx = canvas.getContext('2d');
    if (maybeCtx === null) {
      throw new Error('failed to create 2d context');
    }
    const ctx: CanvasRenderingContext2D = maybeCtx;
    ctx.fillStyle = `rgb(${255 * (0.3 + 0.7 * 0.4)},${255 * (0.5 * 0.4 + 0.5)},${255})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let delta = 0;
    const speed = 0.1;
    const cellSize = 1;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const pxWidth = canvasWidth / cellSize;
    const pxHeight = canvasHeight / cellSize;

    function tick() {
      for (let i = 0; i < pxHeight / 2; i += 1) {
        for (let j = 0; j < pxWidth; j += 1) {
          const x = ((j / pxWidth) * 2) - 1;
          const y = 1 - ((i / pxHeight) * 2);

          const screenCoord = { x, y };

          const wind = scale(0.5, { x: 1, y: 1 });
          const horizDrop = 0.0;
          const rot = -0.1;
          const sampleCoordHighCloud = scale(0.05, translate(scale(2 * delta, wind), rotate(deg2rad(rot * delta), sky(1, 100, horizDrop, screenCoord))));
          const sampleCoordLowCloud = scale(0.04, translate(scale(2 * delta, wind), rotate(deg2rad(rot * delta), sky(1, 40, horizDrop, screenCoord))));
          const sampleCoordVeryLowCloud = scale(0.02, translate(scale(2 * delta, wind), rotate(deg2rad(rot * delta), sky(1, 10, horizDrop, screenCoord))));

          const noiseHighCloud = perlin.noise01(sampleCoordHighCloud.x, sampleCoordHighCloud.y);
          const noiseLowCloud = perlin.noise01(sampleCoordLowCloud.x, sampleCoordLowCloud.y);
          const noiseVeryLowCloud = perlin.noise(sampleCoordVeryLowCloud.x, sampleCoordVeryLowCloud.y);

          const n = Math.min(0.9 * Math.pow(noiseHighCloud, 6) + 1.2 * Math.pow(noiseLowCloud, 1) + 0.6 * Math.pow(noiseVeryLowCloud, 1));
          const c: number = n * Math.pow(y, 0.6) + (1 - Math.pow(y, 0.3)) * 0.5;
          ctx.fillStyle = `rgb(${255 * (0.3 + 0.7 * c)},${255 * (c * 0.5 + 0.5)},${255})`;
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
      }

      delta += speed;
      requestAnimationFrame(tick);
    }
    tick();
  }
}

type Coord2D = {x: number, y: number};

function translate(by: Coord2D, { x, y }: Coord2D): Coord2D {
  return { x: x + by.x, y: y + by.y };
}

function scale(by: number, { x, y }: Coord2D): Coord2D {
  return { x: x * by, y: y * by };
}

function rotate(byRadians: number, { x, y }: Coord2D): Coord2D {
  const currentAngleRadians = Math.atan2(y, x);
  const distance = Math.sqrt((x * x) + (y * y));
  const newAngleRadians = currentAngleRadians + byRadians;
  const rotX = distance * Math.cos(newAngleRadians);
  const rotY = distance * Math.sin(newAngleRadians);
  return { x: rotX, y: rotY };
}

function sky(focalLength: number, skyHeight: number, horizDrop: number, { x, y }: Coord2D): Coord2D {
  const fakeY = y + horizDrop;
  const skyX = (x * skyHeight) / fakeY;
  const skyY = (skyHeight * focalLength) / fakeY;
  return { x: skyX, y: skyY };
}

function perlinTest2() {
  const perlin = new PerlinNoise2D(XorShiftRng.withRandomSeed());
  const [canvas, ctx] = getCanvas2d('c0');
  //const [_c1, ctx1] = getCanvas2d('c1');
  //const [_c2, ctx2] = getCanvas2d('c2');
  let offsetY = 0;
  const zoom = 0.1;
  const pzoom = 7;
  function f() {
    for (let i = 0; i < canvas.height / pzoom; i += 1) {
      for (let j = 0; j < canvas.width / pzoom; j += 1) {
        const x = j * zoom;
        const y = (i * zoom) + offsetY;
        let colour;
        const noise = perlin.noise01(x, y);
        const n = Math.floor(noise * 255);
        colour = `rgb(${n},${n},${n})`;
        const leftX = Math.floor(x);
        const topY = Math.floor(y);
        if (x - leftX < (zoom * 3) && y - topY < (zoom * 3)) {
        //  colour = 'red';
        } else if (noise > 0.5 - zoom / 2 && noise < 0.5 + zoom / 2) {
        //  colour = 'rgba(0,0,255,0.5)';
        //} else if (noise < 0.3) {
        //  colour = 'rgb(0,0,255)';
        }
        ctx.fillStyle = colour;
        ctx.fillRect(j * pzoom, i * pzoom, pzoom, pzoom);
        /*
        const [dx, dy] = perlin.noiseDxy(x, y);
        function d2c(d: number): string {
          const c = Math.floor(((d + 1) / 2) * 255);
          return `rgb(${c},${c},${c})`;
        }
        if (x - leftX < (zoom * 3) && y - topY < (zoom * 3)) {
          colour = 'red';
        } else if (noise > 0.5 - zoom / 2 && noise < 0.5 + zoom / 2) {
          colour = 'rgb(0,255,0)';
        } else {
          colour = d2c(dx);
        }
        ctx1.fillStyle = colour;
        ctx1.fillRect(j, i, 1, 1);

        if (x - leftX < (zoom * 3) && y - topY < (zoom * 3)) {
          colour = 'red';
        } else if (noise > 0.5 - zoom / 2 && noise < 0.5 + zoom / 2) {
          colour = 'rgb(0,255,0)';
        } else {
          colour = d2c(dy);
        }
        ctx2.fillStyle = colour;
        ctx2.fillRect(j, i, 1, 1);
        */

      }
    }
    offsetY += zoom * 1;
    //setTimeout(f, 50);
  }
  f();

  function lineIncreaseRes(line: Coord2[]): Coord2[] {
    const ret = [line[0]];
    for (let i = 1; i < line.length; i += 1) {
      ret.push(line[i].add(line[i - 1]).scalarDiv(2));
      ret.push(line[i]);
    }
    return ret;
  }

  function drawLine(line: Coord2[]): void {
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.moveTo(line[0].x * pzoom / zoom, line[0].y * pzoom / zoom);
    for (let i = 1; i < line.length; i += 1) {
      ctx.lineTo(line[i].x * pzoom / zoom, line[i].y * pzoom / zoom);
    }
    ctx.strokeStyle = 'rgb(0,255,0)';
    ctx.stroke();
  }

  function getNoise(c: Coord2): number {
    return perlin.noise01(c.x, c.y);
  }

  function getNoiseGrad(c: Coord2): Coord2 {
    const [x, y] = perlin.noiseDxy(c.x, c.y);
    return c2(x, y);
  }

  function opt(line: Coord2[]): Coord2[] {
    const nearnessPenalty = (line[0].sub(line[line.length - 1]).length() / line.length) / 2;
    const step = 1 / line.length;
    console.log(nearnessPenalty, step);
    const ret = line.slice();
    for (let i = 1; i < line.length - 1; i += 1) {
      const current = line[i];
      const noise = getNoise(current);
      const grad = getNoiseGrad(current);
      const flatWeight = 2;
      let down = c2(0, 0);
      if (noise > 0.5) {
        down = grad.neg().scalarMul(flatWeight);
      } else if (noise < 0.5) {
        down = grad.scalarMul(flatWeight);
      }
      for (let j = 0; j < line.length; j += 1) {
        if (i == j) {
          continue;
        }
        const delta = current.sub(line[j]);
        if (delta.length() < nearnessPenalty) {
          down = down.add(delta.scalarMul(2));
        }
      }
      const smoothDest = line[i - 1].add(line[i + 1]).scalarDiv(2);
      const smoothPull = smoothDest.sub(current);
      down = down.add(smoothPull.scalarMul(0.5));
      ret[i] = current.add(down.scalarMul(step));
    }
    return ret;
  }

  function plot(a: Coord2, b: Coord2): Coord2[] {
    let line = [a, b];

    for (let i = 0; i < 8; i += 1) {
      line = lineIncreaseRes(line);
      for (let j = 0; j < 20; j += 1) {
        line = opt(line);
      }
    }

    return line;
  }

  drawLine(plot(c2(5, 0), c2(5, 5)));
  drawLine(plot(c2(5, 5), c2(5, 10)));
}

window.onload = () => {
  /*
  perlinTest2();

  window.addEventListener('keypress', (e) => {
    if (e.key === ' ') {
      perlinTest2();
    }
  });
  */
  perlinTest();
  runDemo();
};
