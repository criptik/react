import * as _ from 'underscore';
import CardImage from "../src/CardImage.js";

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
        this.imageWidth = '90px';  // TODO: adjust for other screen widths
        this.shrinkGrowState = 0;
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
        const valid = (this.tripFinish(ia, ib).asint === this.ary[ic].asint);
        return(valid);
    }

    // get finishing value for a dimension
    static attrFinish(a,b) {
        return (6-(a+b)) % 3;
    }

    // finish to make a triplet given 2 member indexes
    tripFinish(ia, ib) {
        const fin=[];
        for (let n=0; n<4; n++) {
            fin.push(CardAry.attrFinish(this.ary[ia].attr(n), this.ary[ib].attr(n)));
        }
        return new CardData(fin);
    }

    // return set of 3 indices if ary includes a triplet, else null
    includesTrip(dbg = this.dbg, idx1start=this.length()-1, idx1end=0, findAll=true) {
        this.tripsFound = [];
        for (let j1=idx1start; j1>=idx1end; j1--) {
            for (let j2=j1-1; j2>=0; j2--) {
                const tripfin = this.tripFinish(j1, j2);
                const tripfinint = tripfin.asint;
                for (let j3=j2-1; j3>=0; j3--) {
                    // if (j3 === j1 || j3 === j2) continue;
                    if (tripfinint === this.ary[j3].asint) {
                        if (dbg) console.log(j1, j2, j3, this.ary[j1].toString(), this.ary[j2].toString(), this.ary[j3].toString());
                        this.tripsFound.push([j1, j2, j3]);
                        if (!findAll) return this.tripsFound[0];
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
    constructor(srcary, gridary=[], minrows=4, cols=3) {
        super(gridary);
        this.source = Array.from(srcary);
        this.minrows = minrows;
        this.cols = cols;
        this.minlength = this.minrows * this.cols;
    }

    pushFromSource() {
        this.ary.push(this.source.shift());
    }
    
    fillFromSource(destidx) {
        this.replace(destidx, this.source.shift());
    }

    backToSource(srcidx) {
        const dat = this.ary[srcidx];
        this.delete(srcidx);
        this.source.unshift(dat);
    }

    setHighlight(idx) {
        this.ary[idx].highlight = true;
    }
    clearHighlight(idx) {
        this.ary[idx].highlight = false;
    }

    // TODO: use this for narrower screens, etc.
    setImageWidth(idx, width) {
        this.ary[idx].imageWidth = `${width}px`;
    }
    
    fillUntilHasTrip(dbg=this.dbg, findAll=true) {
        let goalLength = this.minlength;
        // if no triple, add one more row
        // and repeat until we have a triple
        while (true) {
            while ((this.length() < goalLength) && (this.source.length > 0)) {
                this.fillFromSource(this.length());
            }
            if (dbg  && goalLength > this.minlength) console.log(`grid length is now ${this.length()}`);
            const idx1start = this.length() - 1;
            // for bigger than minimum array, j1 index must be in last row
            const idx1end = (this.length() > this.minlength) ? this.length() - this.cols : 0;
            const tripIdxs = this.includesTrip(dbg, idx1start, idx1end, findAll);
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
    // return the list of indexes which actually got replaced
    // (used by shrinkGrow logic)
    tripRemoveReplace(idxs, dbg=this.dbg, findAll=true) {
        const retList = [];
        const revsortidxs = idxs.sort((a, b) => b - a);
        if (this.source.length < 3){
            const newGridLength = this.length() - 3;
            revsortidxs.forEach((idx) => {
                if (dbg) console.log(`this source < 3, deleting ${idx}`);
                this.delete(idx);
                if (idx < newGridLength) retList.push(idx);
            });
            return retList;
        }
        // at least 3 items in this.source
        // with no extra rows, just fill removed idxs from source
        else if (this.length() <= this.minlength) {
            idxs.forEach((idx) =>  this.fillFromSource(idx));
            return idxs;  // replaced list is same as incoming list
        }
        else {
            if (dbg) console.log('last row special idxs=', revsortidxs);
            // delete any trip members from last row(s)
            revsortidxs.forEach((idx) => {
                if (idx >= this.minlength) {
                    this.delete(idx);
                    if (dbg) console.log(`last row delete ${idx}, length now ${this.length()}`);
                }
                else {
                    // then move remaining last row items up to other empty slots
                    const fromidx = this.length() - 1;
                    this.move(fromidx, idx);
                    if (dbg) console.log(`move last row ${fromidx} to ${idx}, length now ${this.length()}`);
                    retList.push(idx);
                }
            });
            // special case, having gone from 18 to 15, let us check whether
            // a trip exists in the first 12 and if so, trim this down to 12
            // by pushing back to source
            if ((this.length() > this.minlength) && this.includesTrip(dbg, this.minlength-1, 0, findAll)) {
                if (true) console.log(`special case, push last row back to source`);
                for (let n=0; n<this.cols; n++) {
                    const lastidx = this.length() - 1;
                    this.backToSource(lastidx);
                    // and remove from retList if there.
                    const retidx = retList.indexOf(lastidx);
                    if (retidx > -1) {
                        retList.splice(retidx, 1);
                    }
                }
            }
        }
        return retList;
    }
}

class GridSnapshot extends CardGrid {
    constructor(gridary, clickList, elapsedSecs) {
        super([], Array.from(gridary));
        this.elapsedSecs = elapsedSecs;
        this.clickList = Array.from(clickList);
        this.tripsFoundIdx = 0;
    }

    clearAllCardStatus() {
        const allCardsAry = _.range(0, this.length());
        allCardsAry.forEach((idx) => {
            this.clearHighlight(idx);
            this.ary[idx].shrinkGrowState = 0;
        });
    }

    highlightTriple(tripIdxs) {
        // console.log(`calling highlightTriple with ${tripIdxs}`);
        this.clearAllCardStatus();
        tripIdxs.forEach((idx) => this.setHighlight(idx));       
    }
    
    highlightClickList() {
        this.highlightTriple(this.clickList);
    }

    highlightNextTrip() {
        this.highlightTriple(this.tripsFound[this.tripsFoundIdx]);
        this.tripsFoundIdx++;
        if (this.tripsFoundIdx >= this.tripsFound.length) {
            this.tripsFoundIdx=0;
        }
    }
}

export {CardGrid, CardAry, CardData, GridSnapshot};

