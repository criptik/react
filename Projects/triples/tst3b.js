require('process');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function intToDimAry(i) {
    return i.toString(3).padStart(4, '0').split("").map((s) => parseInt(s));
}

function dimAryToInt(a) {
    let result = 0;
    for (let n=0; n<4; n++) {
        result += (3**(3-n) * a[n]);
    }
    return result;
}

function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}


class SqDat {
    constructor(x) {
        if (Array.isArray(x)) {
            this.dimary = x;
            this.asint = dimAryToInt(x);
        }
        else {
            this.asint = x;
            this.dimary = intToDimAry(x);
        }
    }

    dim(n) {
        return this.dimary[n];
    }

    toString() {
        return `[${this.dimary}] (${this.asint})`;
    }
}

class SqDatAry {
    constructor(ary) {
        if (!ary) ary = [];
        this.ary = ary;
    }

    length() {
        return this.ary.length
    }

    push(sqdat) {
        this.ary.push(sqdat);
    }

    isTrip() {
        let valid = arrayEquals(this.tripFinish(0, 1), this.ary[2]);
        // console.log(valid); 
        return(valid);
    }

    static buildDfMap() {
        let m = new Map();
        m.set(0b001, 0);
        m.set(0b010, 1);
        m.set(0b100, 2);
        m.set(0b011, 2);
        m.set(0b101, 1);
        m.set(0b110, 0);
        return m;
    }

    // get finishing value for a dimension
    static dimFinish(a,b) {
        return SqDatAry.dfMap.get(1<<a | 1<<b);
    }

    // finish to make a triplet given 2 member indexes
    tripFinish(ia, ib) {
        let fin=[];
        for (let n=0; n<4; n++) {
            fin.push(SqDatAry.dimFinish(this.ary[ia].dim(n), this.ary[ib].dim(n)));
        }
        return new SqDat(fin);
    }

    // return boolean for whether ary includes a triplet
    includesTrip(dbg = false) {
        for (let j1=0; j1<this.length(); j1++) {
            for (let j2=j1+1; j2<this.length(); j2++) {
                let tripfin = this.tripFinish(j1, j2);
                let tripfinint = tripfin.asint;
                for (let j3=j2+1; j3<this.length(); j3++) {
                    // if (j3 === j1 || j3 === j2) continue;
                    if (tripfinint === this.ary[j3].asint) {
                        if (dbg) console.log(j1, j2, j3, this.ary[j1].toString(), this.ary[j2].toString(), this.ary[j3].toString());
                        return true;
                    }
                }
            }
        }
        return(false);
    }
}
SqDatAry.dfMap = SqDatAry.buildDfMap();

// console.log(SqDatAry.dfMap);

let sq1 = new SqDat([0,0,0,0]);
let sq2 = new SqDat([0,1,2,0]);
let sq3 = new SqDat([1,1,1,1]);
let xa = new SqDatAry([sq1, sq2, sq3]);
console.log(sq1.dimary, sq2.dimary, '==>', xa.tripFinish(0, 1));
console.log(sq1.dimary, sq3.dimary, '==>', xa.tripFinish(0, 2));

let ra = new SqDatAry();
let m = new Map();
do {
    let newval = getRandomInt(0, 80);
    if (!m.get(newval)) {
        ra.push(new SqDat(newval));
    }
} while (ra.length() < 12);

ra.ary.forEach((val) => console.log(val.toString()));
console.log(ra.includesTrip(true));

if (true) {
    let validcount = 0;
    for (let n=0; n<2000000; n++) {
        let valid = ra.includesTrip();
        if (valid) validcount++;
    }
    console.log(validcount);
}
process.exit();
for (let n=0; n<100000; n++) {
    let ra = [];
    do {
        let newval = getRandomInt(0, 80);
        if (!ra.includes(newval)) {
            ra.push(newval);
        }
    } while (ra.length < 12);

    let raa = ra.map((n) => intToDimAry(n));
    let v1 = arrIncludesTrip(raa, ra);
    let v2 = arrIncludesTripAlt(raa, ra);
    if (v1 !== v2) {
        console.log('inconsitency in ', ra);
    }
}
