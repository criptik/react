// First, you need to require the createCanvas() method from the
// module as shown below:

// Then, create a new canvas and pass the width and height of your
// canvas as required. This will be the size of your image output
// later.
// The following example will create a canvas of 1200 X 620:

function drawTriangle(ctx, ctrx, ctry, sidelen) {
    ctx.beginPath();
    let hgt = Math.sqrt(3) * sidelen / 2.0;
    let topx = ctrx;
    let topy = ctry - hgt/2;
    ctx.moveTo(topx, topy);
    ctx.lineTo(topx + sidelen/2, topy + hgt);
    ctx.lineTo(topx - sidelen/2, topy + hgt);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    // console.log(`triangle top at ${topx}, ${topy}`);
}

function drawSquare(ctx, ctrx, ctry, sidelen) {
    let topx = ctrx - sidelen/2;
    let topy = ctry - sidelen/2;
    ctx.fillRect(topx, topy, sidelen, sidelen);
    ctx.strokeRect(topx, topy, sidelen, sidelen);
    // console.log(`square at ${topx}, ${topy}`);
}

function drawCircle(ctx, ctrx, ctry, diam) {
    ctx.beginPath();
    ctx.arc(ctrx, ctry, diam/2.0, 0, 2 * Math.PI, false);
    ctx.stroke();
    ctx.fill();
}
import canvasPkg from "canvas";
const {createCanvas} = canvasPkg;

const width = 700;
const height = 1500;

const canvas = createCanvas(width, height);
// Once the canvas is created, retrieve the context of the canvas by
// using the getContext() method:

const ctx = canvas.getContext("2d");

const patsize = 4;
const colors = ['red', 'blue', 'lime'];
let stripePatMap = new Map();
let canvasMap = new Map();
colors.forEach((color) => {
    const patcanvas = createCanvas(patsize, patsize);
    // canvasMap.set(patcanvas);
    const patcontext = patcanvas.getContext("2d");
    patcontext.fillStyle = color;
    patcontext.fillRect(0, 0, 1, patsize);
    var ptrn = ctx.createPattern(patcanvas, 'repeat');
    stripePatMap.set(color, ptrn);
});

let yloc = 100;
let sidelen = 80;
ctx.lineWidth = 4;
colors.forEach((color) => {
    ctx.strokeStyle = color;

    ctx.fillStyle = stripePatMap.get(color);
    drawTriangle(ctx, 100, yloc, 80);
    ctx.fillStyle = color;
    drawTriangle(ctx, 200, yloc, 80);
    ctx.fillStyle = 'white';
    drawTriangle(ctx, 300, yloc, 80);
    yloc += 150;
});
colors.forEach((color) => {
    ctx.strokeStyle = color;
    let hgt = Math.sqrt(3) * sidelen / 2.0;
    ctx.fillStyle = stripePatMap.get(color);
    drawSquare(ctx, 150, yloc, hgt);
    ctx.fillStyle = color;
    drawSquare(ctx, 250, yloc, hgt);
    yloc += 150;
});
colors.forEach((color) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = stripePatMap.get(color);
    let diam = 80;
    drawCircle(ctx, 200, yloc, diam);
    yloc += 150;
});

// To generate the image, you need to transform the canvas to a buffer
// that can be written to an output using the toBuffer() method:

const buffer = canvas.toBuffer("image/png");

// Finally, you just need to write the output using fs.writeFileSync() method:

import fs from "fs";
fs.writeFileSync("./image.png", buffer);

// An image named image.png will be generated in your current
// folder. This image will be a blank image with yellow color:

