import React from 'react';
// import Switch from "react-switch";
import * as _ from 'underscore';
// import NumericInput from 'react-numeric-input';
import './index.css';
import {CardGrid, CardData, GridSnapshot} from './CardData.js';
import Board from './Board.js';
import ElapsedTime from './ElapsedTime.js';
// import * as assert from 'assert';

var nbsp = String.fromCharCode(160);
var nbspx4 = nbsp.repeat(4);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function tempAlert(msg,duration) {
    var el = document.createElement("textarea");
    el.setAttribute("style", `position:absolute;\
                             top:0%; left:10%; \
                             background-color:red; \
                             border-color:black; \
                             border-width:2px`);
    el.innerHTML = msg;
    setTimeout(function(){
        el.parentNode.removeChild(el);
    },duration);
    document.body.appendChild(el);
}
class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.grid = new CardGrid([]);
        this.state.gameOver = false;
        this.state.paused = false;
        this.state.startTime = new Date();
        this.autoClickPromise = null;
        this.stopAutoClick = false;
        this.numPromise = 0;
        const arcadeDefault = {timeLimitSecs: 60,
                               useDemo : false,
                               filterFunc : null,
                              };
        const classicDefault = {...arcadeDefault, timeLimitSecs: 0};
        this.gameTypeMap = new Map(Object.entries({
            'Arcade'  : arcadeDefault ,
            'Classic' : classicDefault,
            'Arcade Easy' : {...arcadeDefault, filterFunc : n => CardData.intToAttrs(n)[3] === 0},
            'Arcade Demo' : {...arcadeDefault, useDemo: true},
            'Classic Demo' : {...classicDefault, useDemo: true},
        }));
        this.setupGameType('Arcade');
    }

    setupGameType(name) {
        this.gameTypeName = name;
        this.gameTypeObj =  this.gameTypeMap.get(name);
    }
    
    componentDidMount() {
        // first screen shows last played game
        this.startNewGame(false, true);
        this.sawGameOver = true;
        clearInterval(this.elapsedTimer);
        this.setState({
            gameOver: true,
            elapsedSecs : 0,
        });
        // tempAlert('Game Started', 2000);
    }

    restartGame() {
        this.startNewGame(false);
    }
    
    async startNewGame(useNew = true, endImmediately=false) {
        // set stop flag to prevent further autoclick loops
        // then wait for current loop to finish
        this.stopAutoClick = true;
        // console.log(`in startNewGame, ${this.numPromise}`);
        await this.autoClickPromise;
        // console.log(`after await in startNewGame, ${this.numPromise}`);
        // and turn off stop flag
        this.stopAutoClick = false;
        this.endImmediately = endImmediately;
        
        let ishuf;
        const lastTripShufJSON = window.localStorage.getItem('lastTripShuf');
        // check whether we should repeat last game or start a new one
        if (!useNew && lastTripShufJSON) {
            ishuf = JSON.parse(lastTripShufJSON);
            this.isReplay = true;
        }
        else {
            // new game, shuffle the cards 0-80
            let unshuf = _.range(0, 81);
            if (this.gameTypeObj.filterFunc) {
                unshuf = unshuf.filter(this.gameTypeObj.filterFunc);
            }
            ishuf = _.shuffle(unshuf);
            this.isReplay = false;
        }
        window.localStorage.lastTripShuf = JSON.stringify(ishuf);
        const lastTenScoresStorageName = 'lastTenTripScores';
        // uncomment to clear (like for new version)
        // window.localStorage.removeItem(lastTenScoresStorageName);
        const lastTenJSON = window.localStorage.getItem(lastTenScoresStorageName);
        if (lastTenJSON) {
            this.lastTenScores = JSON.parse(lastTenJSON);
        } else {
            this.lastTenScores = {};
            this.gameTypeMap.keys().forEach((name) => this.lastTenScores[name] = []);
        }

        const source = ishuf.map((n) => new CardData(n));
        // For now, the only state we really need is the grid
        this.newgrid = new CardGrid(source);
        
        // start by filling grid with min rows
        // this.state.grid.minrows = 3;
        this.lastTripFound = this.newgrid.fillUntilHasTrip();
        this.pauseWithHighlightsTime = 300;
        this.autoClickWaitTime = 400;
        this.useShrinkGrow = true;
        this.autoClick = this.gameTypeObj.useDemo;
        
        this.clickList = [];
        this.numtrips = this.numwrong = 0;
        this.snapshotStartTime = 0;
        this.snapshots = [];
        this.studyMode = false;
        this.hintsUsed = 0;
        this.hintsAllowed = 0;  // TODO: make this configurable
        this.sawGameOver = false;
        this.setState({
            grid: this.newgrid,
            gameOver: (this.lastTripFound === null || endImmediately) ,
            startTime: new Date(),
            elapsedSecs : 0,
            lastTenScores : this.lastTenScores,
        });
        this.setNewElapsedTimer();
        this.hintError = false;
        this.numPromise = 0;
        this.checkAutoClick();
        // console.log(this.state.grid);
    }

    async setPaused(val) {
        if (this.studyMode) return;
        this.newgrid = this.state.grid;
        this.newpaused = !this.state.paused;
        if (this.newpaused) {
            clearInterval(this.elapsedTimer);
            // if pausing when autoclick in progress, wait for it to finish
            if (this.autoClick) {
                // console.log('about to wait for', this.autoClickPromise, this.clickList);
                this.stopAutoClick = true;
                await this.autoClickPromise;
                // console.log('setpaused autoClickPromise complete', this.newgrid.length(), this.state.grid.length());
                this.newgrid = this.state.grid;
            }
            const allCardsAry = _.range(0, this.newgrid.length());
            await this.cardsImageShrink(allCardsAry);
        }
        else {
            this.setNewElapsedTimer();
            const allCardsAry = _.range(0, this.newgrid.length());
            await this.cardsImageGrow(allCardsAry);
            // if unpausing with autoclick start things up again
            if (this.autoClick) {
                // console.log('about to call autoClickLoop');
                this.stopAutoClick = false;
                this.autoClickLoop();
                // console.log('returned from autoClickLoop');
            }
        }
        this.setState({
            grid: this.newgrid,
            paused: this.newpaused,
        });
    }

    checkAutoClick() {
        if (this.autoClick) {
            this.pauseWithHighlightsTime = 1500;
            this.autoClickLoop();
        }
        else {
            this.pauseWithHighlightsTime = 300;
        }
    }
    
    async click3ProcessStart() {
        // console.log(this.clickList);
        // after timeout do this logic an re-render
        if (this.clickList.length === 0) {
            this.setGridState();
            return;
        }
        const isTrip = this.newgrid.isTrip(this.clickList[0], this.clickList[1], this.clickList[2]);
        if (!isTrip) {
            this.clickList.forEach(idx => this.newgrid.clearHighlight(idx));
            this.clickList = [];
            this.numwrong++;
        }
        else {
            // this logic if it is a triple
            this.numtrips++;
            // save state in snapshot in case study wanted
            this.snapshots.push(new GridSnapshot(this.newgrid.ary, this.clickList, this.elapsedSecs - this.snapshotStartTime));
            // console.log(this.snapshots);
            this.snapshotStartTime = this.elapsedSecs;
            await this.handleTripleRemoval();
        }
        this.setGridState();
    }

    setGridState() {
        this.setState({
            grid: this.newgrid,
        });
    }

    cardsImageGrow(cardIdxs) {
        return this.cardsImageSizeChange(cardIdxs, true);
    }

    cardsImageShrink(cardIdxs) {
        return this.cardsImageSizeChange(cardIdxs, false);
    }

    transitionEndHandler(e) {
    }
    
    async cardsImageSizeChange(cardIdxs, shouldGrow) {
        if (cardIdxs.length === 0) {
            return;
        }
        const idxTransEnd = cardIdxs.slice(-1);
        this.shrinkGrowPromise = new Promise((resolve) => {
            // console.log(`setting onTransEnd(${shouldGrow} for ${idxTransEnd} from ${cardIdxs}`);
            this.newgrid.ary[idxTransEnd].onTransEnd = (e) => {
                // console.log(`in onTransEnd callback for grow=${shouldGrow}, idx=${idxTransEnd} ${e.elapsedTime}`);
                resolve();
            };
        });

        cardIdxs.forEach((idx) =>  this.newgrid.ary[idx].shrinkGrowState = (shouldGrow ? 1 : -1));
        this.setGridState();
        this.forceUpdate();
        // console.log(`before await promise for grow=${shouldGrow}, idx=${idxTransEnd}`);
        await this.shrinkGrowPromise;
        // console.log(`return from shrinkGrowPromise, idx=${idxTransEnd}`);
    }

    async handleTripleRemoval() {
        // this.clickList.forEach(idx => this.newgrid.clearHighlight(idx));
        // before refilling, shrink old img size
        // shrinkGrow actions
        // shrinking
        await this.cardsImageShrink(this.clickList);
        // actual replacement, return is a list of replaced indexes
        const growList = this.newgrid.tripRemoveReplace(this.clickList);
        // console.log('finished tripRemoveReplace', this.clickList, growList);

        // growing
        await this.cardsImageGrow(growList);
        // console.log(`returned from await cardsImageGrow`);

        // finish up and get ready for next
        this.lastTripFound = this.newgrid.fillUntilHasTrip();
        // console.log(`finished fillUntilHasTrip, ${this.lastTripFound}`);
        this.clickList = [];
        // console.log(this.lastTripFound);
        this.setState({
            grid: this.newgrid,
            gameOver: (this.lastTripFound === null || this.state.gameOver),
        });
    }

    async autoClickLoop() {
        this.newgrid = this.state.grid;
        while (this.lastTripFound !== null && this.autoClick && !this.stopAutoClick) {
            this.numPromise++;
            // console.log(`before new Promise #${this.numPromise}, ${this.stopAutoClick}`);
            this.autoClickPromise = new Promise(async (resolve) => {
                this.clickList = [];
                for (let n=0; n<3; n++) {
                    await this.handleClick(this.lastTripFound[n]);
                    await sleep(this.autoClickWaitTime);
                };
                resolve();
            });
            await this.autoClickPromise;
            // console.log('finished awaiting promise');
            // await sleep(500);
            // console.log('finished sleep 500');
            // this.stopAutoClick = true;
            // console.trace();
        }
        if (this.lastTripFound === null) {
            this.setState({
                grid: this.newgrid,
                gameOver: true,
            });
        }
    }
    
    async handleClick(i) {
        // console.log(`click on square ${i}`);
        if (this.state.paused || this.state.gameOver || this.studyMode) return;
        this.newgrid = this.state.grid;
        if (this.clickList.includes(i)) {
            // remove from clicklist and unhighlight
            this.clickList.splice(this.clickList.indexOf(i),1);
            this.newgrid.clearHighlight(i);
        }
        else {
            this.clickList.push(i);
            this.newgrid.setHighlight(i);
        }
        this.setState({
            grid : this.newgrid,
        });
        if (this.clickList.length === 3) {
            await sleep(this.pauseWithHighlightsTime);
            await this.click3ProcessStart();
        }
    }
    
    initBoard() {
    }

    findTripThatFinishesClickList() {
        // if all elems of B are in A, return the rest of A
        function aryDiff(aryA, aryB) {
            const diff = Array.from(aryA);
            for (let elem of aryB) {
                const idxa = diff.indexOf(elem);
                if (idxa === -1) {
                    return [];
                }
                else {
                    diff.splice(idxa, 1);
                }
            }
            return diff
        }
        for (let idx = 0; idx < this.state.grid.tripsFound.length; idx++) {
            const diff = aryDiff(this.state.grid.tripsFound[idx], this.clickList);
            if (diff.length !== 0) {
                return diff;
            }
        }
        // if we got this far, non-zero clickList not partially contained anywhere
        return [];
    }

    async componentDidUpdate() {
        if (this.hintError) {
            this.hintError = false;
            await sleep(500);
            this.forceUpdate();
        }
    }

    
    async onHintClick() {
        // this behaves differently if we are in study mode
        if (this.studyMode) {
            this.newgrid = this.state.grid;
            // console.log(this.newgrid.tripsFoundIdx, this.newgrid.tripsFound);
            this.newgrid.highlightNextTrip();
            this.setGridState();
            return;
        }

        this.hintsUsed++;
        const finisher = this.findTripThatFinishesClickList();
        // console.log(this.clickList, finisher, this.state.grid.tripsFound);
        if (finisher.length === 0) {
            this.hintError = true;
            this.forceUpdate();
            return;
        }
        await this.handleClick(finisher[0]);
        await sleep(100);
        // console.log('end of onHintClick', finisher[0]);
    }

    setNewElapsedTimer() {
        if (this.elapsedTimer) clearInterval(this.elapsedTimer);
        this.elapsedTimer = setInterval(() => this.updateElapsed.bind(this)(), 1000);
    }

    checkRecordScore() {
        // but only if legal
        const noSaveReason = (this.gameTypeObj.useDemo ? 'Demo' :
                              this.hintsUsed > this.hintsAllowed ? 'Hint limit exceeded' :
                              this.isReplay ? 'Game Replayed' :
                              null);
        if (noSaveReason != null) {
            // no message if we are just starting up and showing last game screen
            if (!this.endImmediately) tempAlert(`Score not Recorded: ${noSaveReason}`, 2000);
            return;
        }
        // get here when it is valid to record score
        const ary = this.lastTenScores[this.gameTypeName];
        // score is number of trips unless in classic mode, where it is number of seconds
        const val = (this.gameTypeObj.timeLimitSecs > 0 ? this.numtrips : this.state.elapsedSecs);
        ary.unshift(val);
        ary.length = Math.min(ary.length, 10);
        window.localStorage.lastTenTripScores = JSON.stringify(this.lastTenScores);
    }
    
    updateElapsed() {
        if (!this.state.paused && !this.state.gameOver) {
            const newElapsed = this.state.elapsedSecs + 1;
            this.elapsedSecs = newElapsed;
            const isGameOver = (newElapsed === this.gameTypeObj.timeLimitSecs);
            if (isGameOver) {
                this.stopAutoClick = true;
                this.autoClick = false;
                clearInterval(this.elapsedTimer);
            }
            this.setState({
                elapsedSecs: newElapsed,
                gameOver: isGameOver,
                lastTenScores: this.lastTenScores,
            });
        }
        
    }

    handleGameTypeChange(event) {
        this.setupGameType(event.target.value);
        this.startNewGame(true, true);
    }

    onStudyButtonClick() {
        if (!this.studyMode) {
            this.studyMode = true;
            // sort snapshots by decreasing elapsedTime
            this.snapshots.sort((a,b) => b.elapsedSecs - a.elapsedSecs);
            // console.log(this.snapshots);
            // display the first one
            this.snapIdx = 0;
        }
        else {
            this.snapIdx++;
            if (this.snapIdx >= this.snapshots.length) {
                this.snapIdx = 0;
            }
        }
        const snapshot = this.snapshots[this.snapIdx];
        // run logic to set tripsFound
        snapshot.includesTrip();
        // start by highlighting the clickList triple, if any
        snapshot.highlightClickList();
        
        this.setState({
            grid: snapshot,
            elapsedSecs: snapshot.elapsedSecs,
        });
    }

    checkHandleGameOver() {
        // do one time things when game ends
        if (this.state.gameOver && !this.sawGameOver) {
            this.sawGameOver = true;
            clearInterval(this.elapsedTimer);
            this.stopAutoClick = true;
            this.autoClick = false;
            // save final snapshot
            this.snapshots.push(new GridSnapshot(this.state.grid.ary, [], this.elapsedSecs - this.snapshotStartTime));
            // record score if it was a legal game
            this.checkRecordScore();
        }
    }

    GameControlRowOne() {
        const gameOverStatus = (this.state.gameOver ? `${nbspx4}Game Over` : '');
        return(
            <div>
            <select name="gameType" value={this.gameTypeName} onChange={this.handleGameTypeChange.bind(this)}>
              {Array.from(this.gameTypeMap.keys()).map( (name) => <option value={name}>{name}</option>)}
            </select>
            <button style={{marginLeft: "20px", borderRadius: "20%"}} onClick={this.startNewGame.bind(this)}>
            New
            </button>
              <button style={{marginLeft: "20px", borderRadius: "20%"}} onClick={this.restartGame.bind(this)}>
                {String.fromCharCode(10226)}
              </button>
            <span style={{fontSize: '15px', textAlign: 'right'}}>
            {gameOverStatus}
            </span>
            </div>
        );
    }

    GameControlRowTwo() {
        let hintButtonStyle = {marginLeft: "20px", borderRadius: "50%"};
        if (this.hintError) {
            hintButtonStyle.animationName = "shakeAnim";
            hintButtonStyle.animationDuration = "600ms";
            hintButtonStyle.animationIterationCount = "1";
        }
        let studyButtonStyle = {marginLeft: "20px", borderRadius: "20%"};
        if (!this.state.gameOver) {
            studyButtonStyle = {...studyButtonStyle, visibility:"hidden"};
        }

        return (
            <div className="game-info" style={{marginTop: '10px'}}>
              <div style={{fontSize: "15px", width: '300px'}}>
                <ElapsedTime
                  elapsedSecs = {this.state.elapsedSecs}
                  useDelta = {this.studyMode}
                />
                <button style={{fontSize: "20px", marginLeft: "20px", padding: "0px", borderWidth: "0px"}} onClick={this.setPaused.bind(this)}>
                  {(this.state.paused) ? String.fromCharCode(0x23e9) : String.fromCharCode(0x23f8)}
                </button>
                <button style={hintButtonStyle} onClick={this.onHintClick.bind(this)}>
                  {String.fromCharCode(0x2139)}
                </button>
                <button style={studyButtonStyle} onClick={this.onStudyButtonClick.bind(this)}>
                  Study
                </button>
              </div>
            </div>
        );
    }

    GameInfoRow() {
        function aryAverage(ary) {
            return (ary.length === 0 ? 0 : ary.reduce((a, b) => a + b, 0) / ary.length);
        }

        const tripsStatus = `${String.fromCharCode(9989)} ${this.numtrips} ${nbspx4} ${String.fromCharCode(10060)} ${this.numwrong}`;
        const tripsFound = this.state.grid.tripsFound.length;
        const tripsFoundChar = (tripsFound ? String.fromCharCode(9311 + tripsFound) : ' ');
        const tripsFoundStatus = `${tripsFoundChar}`;

        let lastTenStatus = this.state.lastTenScores ?
            `${nbsp.repeat(6)}${aryAverage(this.state.lastTenScores[this.gameTypeName]).toFixed(1)} (avg)` : ' ';
        return (
            <div className="game-info">
              <p style={{fontSize: '15px', float: 'left'}}>
                {tripsStatus}
                {`${lastTenStatus}`}
              </p>
              <p style={{fontSize: '15px', float: 'right'}}>
                {tripsFoundStatus}
              </p>
              <br/>
            </div>
        );
    }
    
    render() {
        this.checkHandleGameOver();
        // let showDbg = false;
        return (
            <div position="relative">
              {this.GameControlRowOne()}
              {this.GameControlRowTwo()}
              {this.GameInfoRow()}
              <div style={{clear: 'both'}}/>
              <div className="game">
                <Board
                  grid = {this.state.grid}
                  onClick = {(i) => this.handleClick.bind(this)(i)}
                />
              </div>
            </div>
        );
    }
}

export default Game;


