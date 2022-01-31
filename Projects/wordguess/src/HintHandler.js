import React, {Fragment} from "react";
import {EXACT, WRONG, NOTUSE, WRONGBIT, NOTUSEBIT} from './Game.js';

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
            if (errMsg !== null) return errMsg;
        }
        return null; // if we got this far
    }

    policyIncludes(bits) {
        // console.log('policyIncludes', this.gameObj.settings.hintUsePolicy, bits);
        return ((this.gameObj.settings.hintUsePolicy & bits) !== 0)
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
            this.gameObj.greyString += ` ${chval}`;
            this.gameObj.notInPool.add(chval);
        }
        return bgcolor;
    }

    // in this handler, we don't show anything at end of line
    formatGuessTotals(guessObj, guessLine) {
    }

    genErrMsg(newCode, oldCode, pos, newGuess, oldGuess) {
        const oldChr = oldGuess[pos];
        // we know policy at least includes EXACT
        if (oldCode === EXACT) return `chr ${pos+1} must be ${oldChr}, `;
        if (this.policyIncludes(NOTUSEBIT) && oldCode === NOTUSE) {
            return `must not use ${oldChr}, `;
        }
        if (this.policyIncludes(WRONGBIT)&& oldCode === WRONG){
            if (newCode === EXACT) return `chr ${pos+1} must not be ${oldChr}, `;
            if (newCode === NOTUSE) return `must contain ${oldChr}, `;
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
            if (newCode !== oldCode) {
                // errMsg += `chr ${pos+1} ${newCode} !== ${oldCode}, `;
                errMsg += this.genErrMsg(newCode, oldCode, pos, newGuess, guessObj.guess);
            }
        }
        if (errMsg.length > 0) errMsg += `see ${guessObj.guess}`;
        return errMsg;
    }

}

// class for handling hints by just showing totals (harder)
class HintHandlerShowTotals extends HintHandler{
    // when we are not marking guess chars, we only know notInPool
    // which is the special case when no green or yellow
    computeGuessCharColor(guessObj, pos, chval, submitted) {
        const bgcolor = 'white';
        if (submitted && (guessObj.posMap.every(val => val === NOTUSE))) {
            this.gameObj.notInPool.add(chval);
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
        let counts = Array.from([0, 0, 0]);
        posMap.forEach(val => counts[val-1]++);
        return counts;
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
        const [oldE, oldW] = this.countVals(oldPosMap);
        const [newE, newW] = this.countVals(newPosMap);
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
}

export {HintHandler};

