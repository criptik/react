import * as process from 'process';
import * as _ from 'underscore';
import {CardGrid, CardAry, CardData} from './src/carddata.js';
import * as assert from 'assert';

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



let complete = false;
let count = 0;
while (!complete) {
    let ra = new CardAry();
    let ia = [];
    let m = new Map();
    let arysize = 18;
    do {
        let newval = getRandomInt(0, 81);
        if (newval != 81 && m.get(newval) === undefined) {
            ra.push(new CardData(newval));
            ia.push(newval);
            m.set(newval, 1);
        }
    } while (ra.length() < arysize);
    // check
    assert.equal(arysize, new Set(ra.ary).size);
    assert.equal(ia.includes(81), false);
    count += 1;
    if (count % 100000 === 0) process.stdout.write(`${count}\r`);
    // console.log(ra);
    let idxs = ra.includesTrip(false);
    let tripFound = (idxs !== null);
    if (!tripFound) {
        ra.ary.forEach((val) => console.log(val.toString()));        
        console.log(`no triple found with grid length ${ra.length()}, try #${count}`);
        process.exit();
    }
}
