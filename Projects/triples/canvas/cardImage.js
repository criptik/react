// First, you need to require the createCanvas() method from the
// module as shown below:

// Then, create a new canvas and pass the width and height of your
// canvas as required. This will be the size of your image output
// later.

import canvasPkg from "canvas";
const {createCanvas} = canvasPkg;
import fs from "fs";

class CardImage {
    constructor(attrs) {
        const width = 700;
        const height = 1500;

        const canvas = createCanvas(width, height);
        // Once the canvas is created, retrieve the context of the canvas by
        // using the getContext() method:

        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;
        if (CardImage.stripePatMap === null) {
            this.buildStripePatMap();
        }
        this.ctx.lineWidth = 4;
    }

    buildStripePatMap() {
        const patsize = 4;
        CardImage.stripePatMap = new Map();
        CardImage.colors.forEach((color) => {
            const patcanvas = createCanvas(patsize, patsize);
            const patcontext = patcanvas.getContext("2d");
            patcontext.fillStyle = color;
            patcontext.fillRect(0, 0, 1, patsize);
            var ptrn = this.ctx.createPattern(patcanvas, 'repeat');
            CardImage.stripePatMap.set(color, ptrn);
        });
    }
    
    // the following shape drawing functions all take a center x,y and sidelen
    drawTriangle(ctrx, ctry, sidelen) {
        let ctx = this.ctx;
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

    drawSquare(ctrx, ctry, sidelen) {
        let ctx = this.ctx;
        let topx = ctrx - sidelen/2;
        let topy = ctry - sidelen/2;
        ctx.fillRect(topx, topy, sidelen, sidelen);
        ctx.strokeRect(topx, topy, sidelen, sidelen);
        // console.log(`square at ${topx}, ${topy}`);
    }

    drawCircle(ctrx, ctry, diam) {
        let ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(ctrx, ctry, diam/2.0, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.fill();
    }
    // To generate the image, you need to transform the canvas to a buffer
    // that can be written to an output using the toBuffer() method:
    writeImage(imageFileName) {
        const buffer = this.canvas.toBuffer("image/png");
        // write the output using fs.writeFileSync() method:
        fs.writeFileSync(imageFileName, buffer);
    }
    
}

// static properties
CardImage.colors = ['red', 'blue', 'lime'];
CardImage.stripePatMap = null;

// test Code starts here
let yloc = 100;
let sidelen = 80;
let cimg = new CardImage([2, 0, 0, 0]);
let ctx = cimg.ctx;
let shapersAry = [cimg.drawTriangle, cimg.drawSquare, cimg.drawCircle];

CardImage.colors.forEach((color) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = CardImage.stripePatMap.get(color);
    cimg.drawTriangle(100, yloc, sidelen);
    ctx.fillStyle = color;
    cimg.drawTriangle(200, yloc, sidelen);
    ctx.fillStyle = 'white';
    cimg.drawTriangle(300, yloc, sidelen);
    yloc += 150;
});
CardImage.colors.forEach((color) => {
    ctx.strokeStyle = color;

    ctx.fillStyle = CardImage.stripePatMap.get(color);
    cimg.drawSquare(100, yloc, sidelen);
    ctx.fillStyle = color;
    cimg.drawSquare(200, yloc, sidelen);
    ctx.fillStyle = 'white';
    cimg.drawSquare(300, yloc, sidelen);
    yloc += 150;
});
CardImage.colors.forEach((color) => {
    ctx.strokeStyle = color;

    ctx.fillStyle = CardImage.stripePatMap.get(color);
    cimg.drawCircle(100, yloc, sidelen);
    ctx.fillStyle = color;
    cimg.drawCircle(200, yloc, sidelen);
    ctx.fillStyle = 'white';
    cimg.drawCircle(300, yloc, sidelen);
    yloc += 150;
});

cimg.writeImage('./tst.png');
