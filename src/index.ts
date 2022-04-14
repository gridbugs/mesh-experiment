/* eslint-disable */
import { Coord2, c2 } from './coord2';
import {
  Matrix44, deg2rad
} from './math';
import { XorShiftRng } from './xor_shift_rng';
import { PerlinNoise2D } from './perlin_noise_2d';
import { createSky, renderSky } from './gl/sky';
import { createMountains, renderMountains } from './gl/mountains';

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
  const perlin = new PerlinNoise2D(XorShiftRng.withRandomSeed());

  const [_, gl] = getCanvasWebgl2('c');

  const sky = createSky(gl);
  const mountains = createMountains(gl, perlin);

  let count = 0;

  const intrinsic = new Matrix44().setProject(deg2rad(90), 1, 0.1, 10000);
  const extrinsic = new Matrix44();
  const translate = new Matrix44().setIdentity();
  translate.setMultiply(translate, new Matrix44().setScale(4000, 500, 4000));
  const rotate = new Matrix44();
  const transform = new Matrix44();

  function draw() {
    //gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //renderSky(gl, sky);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    extrinsic.setMultiply(translate, rotate.setRotateY(deg2rad(count * 0.1)))
      .setMultiply(rotate.setTranslation(0, -160, 0), extrinsic);
    transform.setMultiply(intrinsic, extrinsic);
    renderMountains(gl, mountains, transform);

    count += 1;
    requestAnimationFrame(draw);
  }

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

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
