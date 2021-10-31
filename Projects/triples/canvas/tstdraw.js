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
    console.log(`triangle top at ${topx}, ${topy}`);
}

function drawSquare(ctx, ctrx, ctry, sidelen) {
    let topx = ctrx - sidelen/2;
    let topy = ctry - sidelen/2;
    ctx.fillRect(topx, topy, sidelen, sidelen);
    ctx.strokeRect(topx, topy, sidelen, sidelen);
    console.log(`square at ${topx}, ${topy}`);
}

const { createCanvas } = require("canvas");

const width = 1200;
const height = 620;

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
ctx.lineWidth = 3;
colors.forEach((color) => {
    ctx.fillStyle = stripePatMap.get(color);
    ctx.strokeStyle = color;
    let hgt = Math.sqrt(3) * sidelen / 2.0;
    drawSquare(ctx, 500, yloc, hgt);

    ctx.fillStyle = stripePatMap.get(color);
    drawTriangle(ctx, 100, yloc, 80);
    ctx.fillStyle = color;
    drawTriangle(ctx, 200, yloc, 80);
    ctx.fillStyle = 'white';
    drawTriangle(ctx, 300, yloc, 80);
    yloc += 150;
});

// You can add texts, colors, or images to the context so it will be
// generated to the output image. Let’s start by adding yellow
// background color to the image by using the fillRect() method:
if (false) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#000";
    ctx.font = "72px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Hello, World!", 400, 120);
    
    drawTriangle(ctx, 100, 100, 60);
    drawTriangle(ctx, 200, 100, 30);
    drawTriangle(ctx, 300, 100, 45);
}

// To generate the image, you need to transform the canvas to a buffer
// that can be written to an output using the toBuffer() method:

const buffer = canvas.toBuffer("image/png");

// Finally, you just need to write the output using fs.writeFileSync() method:

const fs = require("fs");
fs.writeFileSync("./image.png", buffer);

// An image named image.png will be generated in your current
// folder. This image will be a blank image with yellow color:

