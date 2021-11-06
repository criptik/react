import CardImage from "../src/cardImage.js";

// function arrayEquals(a, b) {
//     return Array.isArray(a) &&
//         Array.isArray(b) &&
//         a.length === b.length &&
//         a.every((val, index) => val === b[index]);
// }


class CardData {
    constructor(x) {
        if (x === null) {
            this.attrs = this.asint = x;
        }
        else if (Array.isArray(x)) {
            this.attrs = x;
            this.asint = CardData.attrsToInt(x);
        }
        else {
            this.asint = x;
            this.attrs = CardData.intToAttrs(x);
        }
        this.highlight = false;
        // build the card Image
        this.cimg = new CardImage(this.attrs);
        if (this.attrs !== null) this.cimg.drawCard();
        this.dataURL = this.cimg.canvas.toDataURL();
        // console.log(this);
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

class CardAry {
    constructor(ary) {
        if (!ary) ary = [];
        this.ary = ary;
    }

    length() {
        return this.ary.length
    }

    push(carddata) {
        this.ary.push(carddata);
    }

    isTrip(ia=0, ib=1, ic=2) {
        let valid = (this.tripFinish(ia, ib).asint === this.ary[ic].asint);
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
            fin.push(CardAry.attrFinish(this.ary[ia].attr(n), this.ary[ib].attr(n)));
        }
        return new CardData(fin);
    }

    // return set of 3 indices if ary includes a triplet, else null
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

    replace(idx, carddata) {
        this.ary[idx] = carddata;
    }
    
    delete(idx) {
        this.ary.splice(idx, 1);
    }
    
    move(fromIdx, toIdx) {
        this.ary[toIdx] = this.ary[fromIdx];
        this.delete(fromIdx);
    }
}

class CardGrid extends CardAry {
    constructor(srcary) {
        super();
        this.source = srcary;
        this.minrows = 4;
        this.cols = 3;
        this.blankCard = new CardData(null);
    }

    pushFromSource() {
        this.ary.push(this.source.shift());
    }
    
    fillFromSource(destidx) {
        this.replace(destidx, this.source.shift());
    }

    fillWithBlank(destidx) {
        this.replace(destidx, this.blankCard);
    }

    backToSource(srcidx) {
        let dat = this.ary[srcidx];
        this.delete(srcidx);
        this.source.unshift(dat);
    }

    setHighlight(idx) {
        this.ary[idx].highlight = true;
    }
    clearHighlight(idx) {
        this.ary[idx].highlight = false;
    }

    fillUntilHasTrip(dbg=false) {
        let minLength = this.minrows * this.cols;
        let goalLength = minLength;
        // if no triple, add one more row
        // and repeat until we have a triple
        while (true) {
            while ((this.length() < goalLength) && (this.source.length > 0)) {
                this.fillFromSource(this.length());
            }
            if (dbg  && goalLength > minLength) console.log(`grid length is now ${this.length()}`);
            let tripIdxs = this.includesTrip(dbg);
            if (tripIdxs !== null) return tripIdxs;
            if (dbg) console.log(`no triple found with grid length ${this.length()}`);
            if (this.source.length < this.cols) {
                // ran out of source and no trip yet
                return null;
            }
            // new goal is one more row
            goalLength += this.cols;
        }
        return null;  // should not get this far
    }

    // remove the triplet indicated by the idxs array
    tripRemoveReplace(idxs, dbg=false) {
        let revsortidxs = idxs.sort((a, b) => b - a);
        if (this.source.length < 3){
            revsortidxs.forEach((idx) => {
                if (dbg) console.log(`this source < 3, deleting ${idx}`);
                this.delete(idx);
            });
        }
        // at least 3 items in this.source
        // with no extra rows, just removed idxs from source
        else if (this.length() <= 12) {
            idxs.forEach((idx) =>  this.fillFromSource(idx));
        }
        else {
            if (dbg) console.log('last row special idxs=', revsortidxs);
            // delete any trip members from last row(s)
            revsortidxs.forEach((idx) => {
                if (idx >= 12) {
                    this.delete(idx);
                    if (dbg) console.log(`last row delete ${idx}, length now ${this.length()}`);
                }
                else {
                    // then move remaining last row items up to other empty slots
                    let fromidx = this.length() - 1;
                    if (dbg) console.log(`move last row ${fromidx} to ${idx}`);
                    this.move(fromidx, idx);
                }
            });
            // special case, having gone from 18 to 15, let us check whether
            // a trip exists in the first 12 and if so, trim this down to 12
            // by pushing back to source
            if ((this.length() == 15) && this.includesTrip(true, 12)) {
                if (dbg) console.log(`special case 18 -> 15, push last row back to source`);
                this.backToSource(14);
                this.backToSource(13);
                this.backToSource(12);
            }
        }
    }
}

export {CardGrid, CardAry, CardData};

