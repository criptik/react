// First, you need to require the createCanvas() method from the
// module as shown below:

// Then, create a new canvas and pass the width and height of your
// canvas as required. This will be the size of your image output
// later.

import canvasPkg from "canvas";
const {createCanvas} = canvasPkg;
import fs from "fs";
import process from "process";

/** @abstract **/
class Shape {
    constructor() {
        if (new.target == Shape) {
            throw new TypeError('cannot instantiate Shape class');
            process.exit(1);
        }
    // draw method must be overridden
    // draw(ctx, ctrx, ctry, sidelen) {}
        if (this.draw === undefined) {
            throw new TypeError(`class ${this.constructor.name} did not implement draw method`);
        }
    }
}

class Triangle extends Shape {
    draw(ctx, ctrx, ctry, sidelen) {
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
}

class Square extends Shape {
    draw(ctx, ctrx, ctry, sidelen) {
        let topx = ctrx - sidelen/2;
        let topy = ctry - sidelen/2;
        ctx.fillRect(topx, topy, sidelen, sidelen);
        ctx.strokeRect(topx, topy, sidelen, sidelen);
        // console.log(`square at ${topx}, ${topy}`);
    }
}

class Circle extends Shape {
    draw(ctx, ctrx, ctry, diam) {
        ctx.beginPath();
        ctx.arc(ctrx, ctry, diam/2.0, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.fill();
    }
}

class CardImage {
    constructor(attrs) {
        const width = 700;
        const height = 12000;
        [this.count, this.color, this.fill, this.shape] = attrs;
        
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
    

    // To generate the image, you need to transform the canvas to a buffer
    // that can be written to an output using the toBuffer() method:
    writeImage(imageFileName) {
        const buffer = this.canvas.toBuffer("image/png");
        // write the output using fs.writeFileSync() method:
        fs.writeFileSync(imageFileName, buffer);
    }
    
}

// static properties of CardImage class
CardImage.colors = ['red', 'blue', 'lime'];
CardImage.stripePatMap = null;

// test Code starts here

let yloc = 100;
let sidelen = 80;
let cimg = new CardImage([2, 0, 0, 0]);
let ctx = cimg.ctx;
if (false) {
    let s = new Triangle();
    s.draw(ctx, 100, 100, 50);
    new Square().draw(ctx, 200, 100, 50);
    new Circle().draw(ctx, 300, 100, 50);
    cimg.writeImage('./tst.png');
    process.exit();
}

let cardtot = 0;
[new Triangle(), new Square(), new Circle()].forEach((shaper) => {
    CardImage.colors.forEach((color) => {
        [CardImage.stripePatMap.get(color), color, 'white'].forEach(fillstyle => {
            [[100, 200, 300], [150, 250], [200]].forEach((xlocAry) => {
                xlocAry.forEach( (xloc) => {
                    ctx.strokeStyle = color;
                    ctx.fillStyle = fillstyle;
                    shaper.draw(ctx, xloc, yloc, sidelen);
                });
                cardtot++;
                yloc += 150;
            });
        });
    });
});

cimg.writeImage('./tst.png');
console.log (`${cardtot} cards created`);
