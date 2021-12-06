import React from 'react';
// import Switch from "react-switch";
import * as _ from 'underscore';
// import NumericInput from 'react-numeric-input';
import './index.css';
import {CardGrid, CardData, GridSnapshot} from './CardData.js';
import Board from './Board.js';
import ElapsedTime from './ElapsedTime.js';
// import * as assert from 'assert';


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.grid = new CardGrid(null);
        this.state.gameOver = false;
        this.state.paused = false;
        this.state.startTime = new Date();
        this.demoModeSwitchValue = false;
        this.autoClickPromise = null;
        this.stopAutoClick = false;
        this.numPromise = 0;
        this.gameType = 'Arcade';
    }
    componentDidMount() {
        this.startNewGame();
    }

    restartGame() {
        this.startNewGame(false);
    }
    
    async startNewGame(useNew = true) {
        // set stop flag to prevent further autoclick loops
        // then wait for current loop to finish
        this.stopAutoClick = true;
        // console.log(`in startNewGame, ${this.numPromise}`);
        await this.autoClickPromise;
        // console.log(`after await in startNewGame, ${this.numPromise}`);
        // and turn off stop flag
        this.stopAutoClick = false;
        this.demoModeSwitchValue = (this.gameType.includes('Demo'));
        
        let ishuf;
        // set false here to repeat a previous game
        if (useNew) {
            // shuffle the cards 0-80
            let unshuf = [];
            for (let i=0; i<81; i++) {
                unshuf.push(i);
            }
            ishuf = _.shuffle(unshuf);
            this.isReplay = false;
        }
        else {
            ishuf = JSON.parse(window.localStorage.getItem('lastTripShuf'));
            this.isReplay = true;
        }
        window.localStorage.lastTripShuf = JSON.stringify(ishuf);
        let lastTenJSON = window.localStorage.getItem('lastTenTripScores');
        if (lastTenJSON) {
            this.lastTenScores = JSON.parse(lastTenJSON);
        } else {
            this.lastTenScores = {
                arcade: [],
                classic: [],
            }
        }

        let source = ishuf.map((n) => new CardData(n));
        // For now, the only state we really need is the grid
        this.newgrid = new CardGrid(source);
        
        // start by filling grid with min rows
        // this.state.grid.minrows = 3;
        this.lastTripFound = this.newgrid.fillUntilHasTrip();
        this.autoClick = this.demoModeSwitchValue;
        this.pauseWithHighlightsTime = 300;
        this.autoClickWaitTime = 400;
        this.useShrinkGrow = true;
        
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
            gameOver: (this.lastTripFound === null),
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
            let allCardsAry = _.range(0, this.newgrid.length());
            await this.cardsImageShrink(allCardsAry);
        }
        else {
            this.setNewElapsedTimer();
            let allCardsAry = _.range(0, this.newgrid.length());
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
        let isTrip = this.newgrid.isTrip(this.clickList[0], this.clickList[1], this.clickList[2]);
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
        let idxTransEnd = cardIdxs.slice(-1);
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
        let growList = this.newgrid.tripRemoveReplace(this.clickList);
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

    demoModeSwitchChange() {
        this.demoModeSwitchValue = ! this.demoModeSwitchValue;
        this.autoClick = this.demoModeSwitchValue;
        this.checkAutoClick();
    }

    findTripThatFinishesClickList() {
        // if all elems of B are in A, return the rest of A
        function aryDiff(aryA, aryB) {
            let diff = Array.from(aryA);
            for (let elem of aryB) {
                let idxa = diff.indexOf(elem);
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
            let diff = aryDiff(this.state.grid.tripsFound[idx], this.clickList);
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
        let finisher = this.findTripThatFinishesClickList();
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
        if (this.gameType.includes('Demo')) {
            this.noSaveReason = 'Demo';
            return;
        }
        if (this.hintsUsed > this.hintsAllowed) {
            this.noSaveReason = 'Hint limit exceeded';
            return;
        }
        this.noSaveReason = null;
        let isArcade = this.gameType.includes('Arcade');
        let ary = (isArcade ? this.lastTenScores.arcade : this.lastTenScores.classic);
        let val = (isArcade ? this.numTrips : this.state.elapsedSecs);
        ary.unshift(val);
        ary.length = Math.min(ary.length, 10);
        window.localStorage.lastTenTripScores = JSON.stringify(this.lastTenScores);
    }
    
    updateElapsed() {
        if (!this.state.paused && !this.state.gameOver) {
            let newElapsed = this.state.elapsedSecs + 1;
            this.elapsedSecs = newElapsed;
            let isGameOver = (this.gameType.includes('Arcade') && newElapsed >= 10);   
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
        this.gameType = event.target.value;
        this.startNewGame();
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
        let snapshot = this.snapshots[this.snapIdx];
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
    
    render() {
        function aryAverage(ary) {
            return ary.reduce((a, b) => a + b, 0) / ary.length;
        }
        this.noSaveReason = null;
        this.checkHandleGameOver();
        let nbsp = String.fromCharCode(160);
        let nbspx4 = nbsp.repeat(4);
        let tripsStatus = `${String.fromCharCode(9989)} ${this.numtrips} ${nbspx4} ${String.fromCharCode(10060)} ${this.numwrong}`;
        let tripsFound = this.state.grid.tripsFound.length;
        let tripsFoundChar = (tripsFound ? String.fromCharCode(9311 + tripsFound) : ' ');
        let tripsFoundStatus = `${tripsFoundChar}`;

        let gameStatus = (this.state.gameOver ? `${nbspx4}Game Over` : '');
        let lastTenStatus = this.state.lastTenScores ? `${nbsp.repeat(6)}${aryAverage(this.state.lastTenScores.arcade).toFixed(1)} (avg)` : ' ';
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
        let fingerStyle = {position:"absolute",
                           left:"300px",
                           top:"150px",
                           visibility:"hidden",
                          };
        if (this.state.elapsedSecs > 5) {
            fingerStyle = {...fingerStyle,
                           transition:"transform 1000ms",
                           transform:"translateX(-200px)",
                          };
        }
        
        // let showDbg = false;
        return (
            <div position="relative">
              <select name="gameType" value={this.gameType} onChange={this.handleGameTypeChange.bind(this)}>
                <option value="Arcade">Arcade</option>
                <option value="Classic">Classic</option>
                <option value="ArcadeDemo">Arcade Demo</option>
                <option value="ClassicDemo">Classic Demo</option>
              </select>
              <button style={{marginLeft: "20px", borderRadius: "20%"}} onClick={() => this.startNewGame.bind(this)()}>
                New
              </button>
              <button style={{marginLeft: "20px", borderRadius: "20%"}} onClick={() => this.restartGame.bind(this)()}>
                {String.fromCharCode(10226)}
              </button>
              <span style={{fontSize: '15px', textAlign: 'right'}}>
                {gameStatus}
              </span>
              <p/>
              <div className="game-info">
                <div style={{fontSize: "15px", width: '300px'}}>
                  <ElapsedTime
                    elapsedSecs = {this.state.elapsedSecs}
                    useDelta = {this.studyMode}
                  />
                  <button style={{fontSize: "20px", marginLeft: "20px", padding: "0px", borderWidth: "0px"}} onClick={() => this.setPaused.bind(this)()}>
                    {(this.state.paused) ? String.fromCharCode(0x23e9) : String.fromCharCode(0x23f8)}
                  </button>
                  <button style={hintButtonStyle} onClick={() => this.onHintClick.bind(this)()}>
                    {String.fromCharCode(0x2139)}
                  </button>
                  <button style={studyButtonStyle} onClick={() => this.onStudyButtonClick.bind(this)()}>
                    Study
                  </button>
                  <p/>
                  <p style={{fontSize: '15px', float: 'left'}}>
                    {tripsStatus}
                    {`${lastTenStatus}`}
                  </p>
                  <p style={{fontSize: '15px', float: 'right'}}>
                    {tripsFoundStatus}
                  </p>
                  <br/>
                  <div style={{clear: 'both'}}>
                  </div>
                </div>
              </div>
              <div>
                {(this.noSaveReason ? `Score not Saved: ${this.noSaveReason}` : '')}
              </div>
              <div className="game">
                <div className="game-board">
                  <Board
                    grid = {this.state.grid}
                    onClick = {(i) => this.handleClick.bind(this)(i)}
                  />
                </div>
              </div>
              <img alt="missing hand"
                   src="clipart533971.png"
                   height="auto"
                   width="20px"
                   style={fingerStyle}
              />
            </div>
        );
    }
}

export default Game;


