// First, you need to require the createCanvas() method from the
// module as shown below:

// Then, create a new canvas and pass the width and height of your
// canvas as required. This will be the size of your image output
// later.

import canvasPkg from "canvas";
const {createCanvas} = canvasPkg;
import fs from "fs";
import process from "process";
import child_process from "child_process";

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
        sidelen -= 2;
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
        const width = 120;
        const height = 50;
        [this.count, this.color, this.fill, this.shape] = attrs;
        
        const canvas = createCanvas(width, height);
        // Once the canvas is created, retrieve the context of the canvas by
        // using the getContext() method:

        this.ctx = canvas.getContext("2d");
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, width, height);
        this.canvas = canvas;
        if (CardImage.stripePatMap === null) {
            this.buildStripePatMap();
        }
        this.ctx.lineWidth = 4;
    }

    drawCard() {
        const xlocArys = [[60], [40, 80], [20, 60, 100]];
        const xlocAry = xlocArys[this.count];
        let color = CardImage.colors[this.color];
        let fillstyle = [CardImage.stripePatMap.get(color), color, 'white'][this.fill];
        let shaper = [new Triangle(), new Square(), new Circle()][this.shape];
        let ctx = this.ctx;
        xlocAry.forEach( (xloc) => {
            ctx.strokeStyle = color;
            ctx.fillStyle = fillstyle;
            shaper.draw(ctx, xloc, 25, 33);
        });
    }
    
    buildStripePatMap() {
        const patsize = 3;
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

export default CardImage;
