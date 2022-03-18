import React, {Fragment} from "react";
import {EXACT, WRONG, NOTUSE, UNKNOWN, WRONGBIT, NOTUSEBIT} from './Game.js';

const nbsp = String.fromCharCode(160);

// abstract class for the different ways of handling hints
class HintHandler {
    constructor(gameObj) {
        if (new.target === HintHandler) {
            throw new TypeError('cannot instantiate HintHandler class');
        }
        // some methods must be overridden
        if (this.computeGuessCharColor === undefined) {
            throw new TypeError(`class ${this.constructor.name} did not implement computeGuessCharColor method`);
        }
        if (this.formatGuessTotals === undefined) {
            throw new TypeError(`class ${this.constructor.name} did not implement formatGuessTotals method`);
        }
        if (this.comparePosMaps === undefined) {
            throw new TypeError(`class ${this.constructor.name} did not implement comparePosMaps method`);
        }
        this.gameObj = gameObj;
    }

    static getHintHandler(gameObj) {
        return (gameObj.settings.noMarkGuessChars ? new HintHandlerShowTotals(gameObj) : new HintHandlerMarkChars(gameObj));
    }
    
    //framework for checking all hints
    checkUseAllHints(newGuess) {
        // for each previous guess, going backwards, see if our guess would produce a similar result
        for (let gidx = this.gameObj.guessList.length-1; gidx >= 0; gidx--) {
            const guessObj = this.gameObj.guessList[gidx];
            const oldPosMap = guessObj.posMap;
            // get compare info for that guess vs. our new guess
            const newPosMap = this.gameObj.doCompare(guessObj.guess, newGuess);
            const errMsg = this.comparePosMaps(oldPosMap, newPosMap, newGuess, guessObj);
            if (errMsg !== '') return errMsg;
        }
        return null; // if we got this far
    }

    policyIncludes(bits) {
        // console.log('policyIncludes', this.gameObj.settings.hintUsePolicy, bits);
        return ((this.gameObj.settings.hintUsePolicy & bits) !== 0)
    }

    hasUnknowns(val1, val2) {
        return (val1 === UNKNOWN && val2 === UNKNOWN);
    }
}

// class for handling hints by marking chars
class HintHandlerMarkChars extends HintHandler{
    computeGuessCharColor(guessObj, pos, chval, submitted) {
        let bgcolor = 'white'; // default
        if (guessObj.posMap[pos] === EXACT) {
            bgcolor = 'lightgreen';
            this.gameObj.greenString += ` ${chval}`;
        }
        else if (guessObj.posMap[pos] === WRONG) {
            bgcolor = 'yellow';
            this.gameObj.yellowString += ` ${chval}`;
        }
        else if (submitted) {
            const markedCount = this.getMarkedCount(guessObj.guess, guessObj.posMap, chval);
            if (markedCount === 0) {
                this.gameObj.greyString += ` ${chval}`;
                this.gameObj.notInPool[chval] = 1;
            }
        }
        return bgcolor;
    }

    // in this handler, we don't show anything at end of line
    formatGuessTotals(guessObj, guessLine) {
    }

    getMarkedCount(guess, posMap, searchChr) {
        let count = 0;
        Array.from(guess).forEach( (chr, idx) => {
            count += (posMap[idx] !== NOTUSE && chr === searchChr) ? 1 : 0;
        });
        return count;
    }
    
    genErrMsg(newPosMap, oldPosMap, pos, newGuess, oldGuess) {
        const newCode = newPosMap[pos];
        const oldCode = oldPosMap[pos];
        const oldChr = oldGuess[pos];
        // we know policy at least includes EXACT
        if (oldCode === EXACT) return `chr ${pos+1} must be ${oldChr}, `;
        if (this.policyIncludes(NOTUSEBIT) && oldCode === NOTUSE) {
            // see if oldChr is used in EXACT or WRONG to adjust errmsg
            const count = this.getMarkedCount(oldGuess, oldPosMap, oldChr);
            const usesStr = (count === 1 ? 'use' :'uses');
            return (count === 0 ?
                    `must not use ${oldChr}, ` :
                    `only ${count} ${usesStr} of ${oldChr}, `);
        }
        if (this.policyIncludes(WRONGBIT)&& oldCode === WRONG){
            if (newCode === EXACT) return `chr ${pos+1} must not be ${oldChr}, `;
            if (newCode === NOTUSE) return `must use ${oldChr} somewhere, `;
        }
        return '';
    }

    comparePosMaps(oldPosMap, newPosMap, newGuess, guessObj) {
        // console.log(`${guessObj.guess}, ${newPosMap}, ${oldPosMap}`);
        const len = newGuess.length;
        let errMsg = '';
        for (let pos=0; pos<len; pos++) {
            const newCode = newPosMap[pos];
            const oldCode = oldPosMap[pos];
            if (!this.hasUnknowns(newCode, oldCode) && newCode !== oldCode) {
                // errMsg += `chr ${pos+1} ${newCode} !== ${oldCode}, `;
                errMsg += this.genErrMsg(newPosMap, oldPosMap, pos, newGuess, guessObj.guess);
            }
        }
        if (errMsg.length > 0) errMsg += `see ${guessObj.guess}`;
        return errMsg;
    }

    possibleListFilter(tstPosMap, basePosMap) {
        return tstPosMap.every((val, index) => val === basePosMap[index] || this.hasUnknowns(val, basePosMap[index]));
    }
}

// class for handling hints by just showing totals (harder)
class HintHandlerShowTotals extends HintHandler{
    // when we are not marking guess chars, we only know notInPool
    // which is the special case when no green or yellow
    computeGuessCharColor(guessObj, pos, chval, submitted) {
        const bgcolor = 'white';
        if (submitted && (guessObj.posMap.every(val => val === NOTUSE))) {
            this.gameObj.notInPool[chval] = 1;
        }
        return bgcolor;
    }

    styleForTotals(type) {
        return {
            borderRadius: '50%',
            height: '20px',
            width: '20px',
            display: 'inline-block',
            marginLeft: '10px',
            marginBottom: '5px',
            textAlign: 'center',
            backgroundColor: (type === EXACT ? 'lightgreen' : 'yellow'),
        };
    }
    
    // in this handler we do show totals at end of guess line
    formatGuessTotals(guessObj, guessLine) {
        const [exlen, wplen] = this.countVals(guessObj.posMap);
        [EXACT, WRONG].forEach(type => {
            const chval = (type===EXACT ? exlen : wplen);
            guessLine.push(
                <div style={this.styleForTotals(type)} >
                  {chval}
                </div>
            );
        });
    }
    
    countVals(posMap) {
        let counts = Array.from([0, 0, 0, 0]);
        posMap.forEach(val => counts[val-1]++);
        return counts;
    }

    countKnownVals(oldPosMap, newPosMap) {
        let oldcounts = Array.from([0,0,0,0]);
        let newcounts = Array.from([0,0,0,0]);
        for (let idx=0; idx < oldPosMap.length; idx++) {
            const oldval = oldPosMap[idx];
            const newval = newPosMap[idx];
            if (!this.hasUnknowns(oldval, newval)) {
                oldcounts[oldval-1]++;
                newcounts[newval-1]++;
            }
        }
        return [oldcounts[0], oldcounts[1], newcounts[0], newcounts[1]];
    }

    genCountSpans(exact, wrong) {
        const yellowSpan = (!this.policyIncludes(WRONGBIT) ? '' : (
              <span style={this.styleForTotals(WRONG)}>
                {wrong}
              </span>
        ));            
        return (
            <Fragment>
              <span style={this.styleForTotals(EXACT)}>
                {exact}
              </span>
              {yellowSpan}
            </Fragment>
        );
    }
    
    comparePosMaps(oldPosMap, newPosMap, newGuess, guessObj) {
        const [oldE, oldW, newE, newW] = this.countKnownVals(oldPosMap, newPosMap);
        let errMsg = '';
        if (oldE !== newE || (this.policyIncludes(WRONGBIT) && oldW !== newW)) {
            // console.log(this.gameObj.settings.hintUsePolicy, oldE, oldW, newE, newW);
            errMsg = (
                <Fragment>
                  {`from ${guessObj.guess}, need `}
                  {this.genCountSpans(oldE, oldW)}
                  {`,${nbsp}${nbsp}not `}
                  {this.genCountSpans(newE, newW)}
                </Fragment>
            );
        }
        return errMsg;
    }

    possibleListFilter(tstPosMap, basePosMap) {
        const [tstE, tstW, baseE, baseW] = this.countKnownVals(tstPosMap, basePosMap);
        return (tstE === baseE && tstW === baseW);
    }
    
}

export {HintHandler};

