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
        this.imageWidth = '80px';
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
        this.dbg = false;
        this.tripsFound = [];
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
    includesTrip(dbg = this.dbg, idx1start=this.length()-1, idx1end=0) {
        this.tripsFound = [];
        for (let j1=idx1start; j1>=idx1end; j1--) {
            for (let j2=j1-1; j2>=0; j2--) {
                let tripfin = this.tripFinish(j1, j2);
                let tripfinint = tripfin.asint;
                for (let j3=j2-1; j3>=0; j3--) {
                    // if (j3 === j1 || j3 === j2) continue;
                    if (tripfinint === this.ary[j3].asint) {
                        if (dbg) console.log(j1, j2, j3, this.ary[j1].toString(), this.ary[j2].toString(), this.ary[j3].toString());
                        this.tripsFound.push([j1, j2, j3]);
                    }
                }
            }
        }
        return (this.tripsFound.length === 0 ? null : this.tripsFound[0]);
    }

    get(idx) {
        return this.ary[idx];
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
    constructor(srcary, minrows=4, cols=3) {
        super();
        this.source = srcary;
        this.minrows = minrows;
        this.cols = cols;
        this.minlength = this.minrows * this.cols;
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

    setImageWidth(idx, width) {
        try {
            if (width === '0px') {
                console.log(idx, width);
            }

            this.ary[idx].imageWidth = `${width}px`;
        }
        catch(e) {
            console.log(e, idx, width);
        }
    }
    
    fillUntilHasTrip(dbg=this.dbg) {
        let goalLength = this.minlength;
        // if no triple, add one more row
        // and repeat until we have a triple
        while (true) {
            while ((this.length() < goalLength) && (this.source.length > 0)) {
                this.fillFromSource(this.length());
            }
            if (dbg  && goalLength > this.minlength) console.log(`grid length is now ${this.length()}`);
            let idx1start = this.length() - 1;
            // for bigger than minimum array, j1 index must be in last row
            let idx1end = (this.length() > this.minlength) ? this.length() - this.cols : 0;
            let tripIdxs = this.includesTrip(dbg, idx1start, idx1end);
            if (tripIdxs !== null) return tripIdxs;
            if (dbg) console.log(`no triple found with grid length ${this.length()}`);
            if (this.source.length < this.cols) {
                // ran out of source and no trip yet
                return null;
            }
            // new goal is one more row
            goalLength += this.cols;
        }
    }

    // remove the triplet indicated by the idxs array
    // return true if it was replaced, false if just deleted
    tripRemoveReplace(idxs, dbg=this.dbg) {
        // console.log(idxs);
        let retval = true;
        let revsortidxs = idxs.sort((a, b) => b - a);
        if (this.source.length < 3){
            revsortidxs.forEach((idx) => {
                if (dbg) console.log(`this source < 3, deleting ${idx}`);
                this.delete(idx);
            });
            retval = false;
        }
        // at least 3 items in this.source
        // with no extra rows, just removed idxs from source
        else if (this.length() <= this.minlength) {
            idxs.forEach((idx) =>  this.fillFromSource(idx));
        }
        else {
            if (dbg) console.log('last row special idxs=', revsortidxs);
            // delete any trip members from last row(s)
            revsortidxs.forEach((idx) => {
                if (idx >= this.minlength) {
                    this.delete(idx);
                    if (dbg) console.log(`last row delete ${idx}, length now ${this.length()}`);
                    retval = false;
                }
                else {
                    // then move remaining last row items up to other empty slots
                    let fromidx = this.length() - 1;
                    this.move(fromidx, idx);
                    if (dbg) console.log(`move last row ${fromidx} to ${idx}, length now ${this.length()}`);
                }
            });
            // special case, having gone from 18 to 15, let us check whether
            // a trip exists in the first 12 and if so, trim this down to 12
            // by pushing back to source
            if ((this.length() > this.minlength) && this.includesTrip(dbg, this.minlength-1, 0)) {
                if (true) console.log(`special case, push last row back to source`);
                for (let n=0; n<this.cols; n++) {
                    this.backToSource(this.length() - 1);
                }
            }
        }
        return retval;
    }
}

export {CardGrid, CardAry, CardData};

