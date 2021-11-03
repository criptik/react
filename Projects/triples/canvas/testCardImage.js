import process from "process";
import child_process from "child_process";
import CardImage from "../src/cardImage.js";

// test Code starts here

let yloc = 100;
let sidelen = 80;
process.argv.shift();
let attrs = process.argv.slice(1,5);
for (let n=0; n<81; n++) {
    attrs = [n%3, Math.trunc(n/3)%3,Math.trunc(n/9)%3,Math.trunc(n/27)%3];
    let cimg = new CardImage(attrs);
    // console.log(cimg);
    cimg.drawCard();
    let pngName = `./tst${attrs.join("")}.png`;
    cimg.writeImage(pngName);
    child_process.spawnSync('/usr/bin/eog', [pngName], {
        timeout:500
    });
}

