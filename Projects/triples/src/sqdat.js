function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}


class Sqdat {
    constructor(x) {
        if (Array.isArray(x)) {
            this.attrs = x;
            this.asint = Sqdat.attrsToInt(x);
        }
        else {
            this.asint = x;
            this.attrs = Sqdat.intToAttrs(x);
        }
    }

    static intToAttrs(i) {
        return i.toString(3).padStart(4, '0').split("").map((s) => parseInt(s));
    }

    static attrsToInt(a) {
        let result = 0;
        for (let n=0; n<4; n++) {
            result += (3**(3-n) * a[n]);
        }
        return result;
    }


    attr(n) {
        return this.attrs[n];
    }

    toString() {
        return `[${this.attrs}] (${this.asint})`;
    }
}

class SqdatAry {
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

    isTrip(ia=0, ib=1, ic=2) {
        let valid = arrayEquals(this.tripFinish(ia, ib), this.ary[ic]);
        return(valid);
    }

    // get finishing value for a dimension
    static attrFinish(a,b) {
        return (6-(a+b)) % 3;
    }

    // finish to make a triplet given 2 member indexes
    tripFinish(ia, ib) {
        let fin=[];
        for (let n=0; n<4; n++) {
            fin.push(SqdatAry.attrFinish(this.ary[ia].attr(n), this.ary[ib].attr(n)));
        }
        return new Sqdat(fin);
    }

    // return boolean for whether ary includes a triplet
    includesTrip(dbg = false, idxlimit=this.length()) {
        for (let j1=0; j1<idxlimit; j1++) {
            for (let j2=j1+1; j2<idxlimit; j2++) {
                let tripfin = this.tripFinish(j1, j2);
                let tripfinint = tripfin.asint;
                for (let j3=j2+1; j3<idxlimit; j3++) {
                    // if (j3 === j1 || j3 === j2) continue;
                    if (tripfinint === this.ary[j3].asint) {
                        if (dbg) console.log(j1, j2, j3, this.ary[j1].toString(), this.ary[j2].toString(), this.ary[j3].toString());
                        return [j1, j2, j3];
                    }
                }
            }
        }
        return null;
    }

    replace(idx, sqdat) {
        this.ary[idx] = sqdat;
    }
    
    delete(idx) {
        this.ary.splice(idx, 1);
    }
    
    move(fromIdx, toIdx) {
        this.ary[toIdx] = this.ary[fromIdx];
        this.delete(fromIdx);
    }
}

class SqdatGrid extends SqdatAry {
    constructor(srcary) {
        super();
        this.source = srcary;
        this.minrows = 4;
        this.cols = 3;
    }

    pushFromSource() {
        this.ary.push(this.source.shift());
    }
    
    fillFromSource(destidx) {
        this.replace(destidx, this.source.shift());
    }

    backToSource(srcidx) {
        let dat = this.ary[srcidx];
        this.delete(srcidx);
        this.source.unshift(dat);
    }
}

export {SqdatGrid, SqdatAry, Sqdat};

