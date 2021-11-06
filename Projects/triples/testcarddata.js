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
console.log(sq1.attrs, sq2.attrs, '==>', xa.tripFinish(0, 1).attrs);
console.log(sq1.attrs, sq3.attrs, '==>', xa.tripFinish(0, 2).attrs);

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

while (true) {
    let idxs = grid.fillUntilHasTrip(true);
    if (idxs === null) break;
    console.log(`before tripRemove, grid length ${grid.length()}, source length ${grid.source.length}`);
    grid.tripRemoveReplace(idxs, true);
    console.log(`after  tripRemove, grid length ${grid.length()}, source length ${grid.source.length}`);
}
