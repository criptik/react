import * as process from 'process';
import * as _ from 'underscore';
import {CardGrid, CardAry, CardData} from './src/carddata.js';

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


let sq1 = new CardData([0,0,0,0]);
let sq2 = new CardData([0,1,2,0]);
let sq3 = new CardData([1,1,1,1]);
let xa = new CardAry([sq1, sq2, sq3]);
console.log(sq1.attrs, sq2.attrs, '==>', xa.tripFinish(0, 1));
console.log(sq1.attrs, sq3.attrs, '==>', xa.tripFinish(0, 2));

let ra = new CardAry();
let m = new Map();
do {
    let newval = getRandomInt(0, 80);
    if (!m.get(newval)) {
        ra.push(new CardData(newval));
    }
} while (ra.length() < 12);
// console.log(ra);

if (false) {
    let validcount = 0;
    for (let n=0; n<2000000; n++) {
        let valid = ra.includesTrip();
        if (valid) validcount++;
    }
    console.log(validcount);
}

function buildShufArray() {
    // shuffle the cards 0-80
    let unshuf = [];
    for (let i=0; i<81; i++) {
        unshuf.push(new CardData(i));
    }
    return _.shuffle(unshuf);
}
let shuf = buildShufArray();
// console.log(shuf);
let grid = new CardGrid(shuf);
for (let n=0; n<12; n++) {
    grid.pushFromSource();
}
// console.log(grid);

let complete = false;
while (!complete) {
    let idxs = grid.includesTrip(true);
    let tripFound = (idxs !== null);
    if (!tripFound) {
        console.log(`no triple found with grid length ${grid.length()}`);
        if (grid.source.length >= 3) {
            for (let n=0; n<3; n++) {
                grid.pushFromSource();
            }
        }
        else {
            complete = true;
        }
    }
    else {
        let revsortidxs = idxs.sort((a, b) => b - a);
        if (grid.source.length < 3){
            revsortidxs.forEach((idx) => {
                console.log(`grid source < 3, deleting ${idx}`);
                grid.delete(idx);
            });
        }
        else {
            // at least 3 items in grid.source
            // with no extra rows, just fill from source
            if (grid.length() <= 12) {
                idxs.forEach((idx) =>  grid.fillFromSource(idx));
            }
            else {
                console.log('last row special idxs=', revsortidxs);
                // delete any trip members from last row(s)
                revsortidxs.forEach((idx) => {
                    if (idx >= 12) {
                        grid.delete(idx);
                        console.log(`last row delete ${idx}, length now ${grid.length()}`);
                    }
                    else {
                        // then move remaining last row items up to other empty slots
                        let fromidx = grid.length() - 1;
                        console.log(`move last row ${fromidx} to ${idx}`);
                        grid.move(fromidx, idx);
                    }
                });
                // special case, having gone from 18 to 15, let us check whether
                // a trip exists in the first 12 and if so, trim grid down to 12
                // by pushing back to source
                if ((grid.length() == 15) && grid.includesTrip(true, 12)) {
                    console.log(`special case 18 -> 15, push last row back to source`);
                    grid.backToSource(14);
                    grid.backToSource(13);
                    grid.backToSource(12);
                }

            }
        }
    }
    console.log(`grid length ${grid.length()}, source length ${grid.source.length}`);
}
