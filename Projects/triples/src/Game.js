import React from 'react';
import Switch from "react-switch";
import * as _ from 'underscore';
// import NumericInput from 'react-numeric-input';
import './index.css';
import {CardGrid, CardData} from './carddata.js';
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
        this.state.grid = new CardGrid(null, 4, 3);
        this.state.gameOver = false;
        this.state.paused = false;
        this.state.startTime = new Date();
        this.demoModeSwitchValue = false;
        this.autoClickPromise = null;
        this.stopAutoClick = false;
        this.numPromise = 0;
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
        this.demoModeSwitchValue = false;
        
        let ishuf;
        // set false here to repeat a previous game
        if (useNew) {
            // shuffle the cards 0-80
            let unshuf = [];
            for (let i=0; i<81; i++) {
                unshuf.push(i);
            }
            ishuf = _.shuffle(unshuf);
        }
        else {
            ishuf = JSON.parse(window.localStorage.getItem('lastTripShuf'));
        }
        window.localStorage.lastTripShuf = JSON.stringify(ishuf);

        let source = ishuf.map((n) => new CardData(n));
        // For now, the only state we really need is the grid
        this.newgrid = new CardGrid(source, 4, 3);
        
        // start by filling grid with min rows
        // this.state.grid.minrows = 3;
        this.lastTripFound = this.newgrid.fillUntilHasTrip();
        this.autoClick = this.demoModeSwitchValue;
        this.pauseWithHighlightsTime = 300;
        this.pauseWithBlanksTime = 300;
        this.shrinkGrowTime = 50;
        this.useShrinkGrow = true;
        
        this.clickList = [];
        this.numtrips = this.numwrong = 0;
        this.setState({
            grid: this.newgrid,
            gameOver: (this.lastTripFound === null),
            startTime: new Date(),
        });
        this.numPromise = 0;
        this.checkAutoClick();
        this.clearElapsed = true;
        // console.log(this.state.grid);
    }

    async setPaused(val) {
        this.newgrid = this.state.grid;
        this.newpaused = !this.state.paused;
        if (this.newpaused) {
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
            this.pauseWithBlanksTime = 500;
            this.autoClickLoop();
        }
        else {
            this.pauseWithHighlightsTime = 300;
            this.pauseWithBlanksTime = 300;
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
            await this.handleTripleRemoval();
        }
        this.setGridState();
    }

    setGridState() {
        this.setState({
            grid: this.newgrid,
        });
    }

    growPercentages() {
        return [0, 20, 40, 60, 80];
    }

    cardsImageGrow(cardIdxs) {
        return this.cardsImageSizeChange(cardIdxs, true);
    }

    cardsImageShrink(cardIdxs) {
        return this.cardsImageSizeChange(cardIdxs, false);
    }

    
    async cardsImageSizeChange(cardIdxs, shouldGrow) {
        let ary = (shouldGrow ? this.growPercentages() : this.growPercentages().reverse());
        for (let widx=0; widx < ary.length; widx++) {
            let width = `${ary[widx]}px`;
            cardIdxs.forEach((idx) =>  this.newgrid.setImageWidth(idx, width));
            await sleep(this.shrinkGrowTime);
            this.setGridState();
        }
        // console.log('finished imageSizeChange', cardIdxs, shouldGrow);
    }

    async useBlankReplacement() {
        this.clickList.forEach((idx) =>  this.newgrid.fillWithBlank(idx));
        await sleep(this.pauseWithBlanksTime);
        this.setGridState();
        // actual replacement
        this.newgrid.tripRemoveReplace(this.clickList);
    }
    
    async handleTripleRemoval() {
        // before refilling, shrink old img size
        // logic to use before actual replacement
        if (this.useShrinkGrow) {
            // shrinking
            await this.cardsImageShrink(this.clickList);
            // actual replacement
            let allStillThere = this.newgrid.tripRemoveReplace(this.clickList);
            // console.log('finished tripRemoveReplace', this.clickList);
            // growing
            if (allStillThere) {
                await this.cardsImageGrow(this.clickList);
            } else {
                // console.log('not allStillThere', this.clickList);
            }
        }
        else {
            this.useBlankReplacement();
        }

        // finish up and get ready for next
        this.lastTripFound = this.newgrid.fillUntilHasTrip();
        // console.log(`finished fillUntilHasTrip, ${this.lastTripFound}`);
        this.clickList = [];
        // console.log(this.lastTripFound);
        this.setState({
            grid: this.newgrid,
            gameOver: (this.lastTripFound === null),
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
                    await sleep(100);
                };
                resolve();
            });
            await this.autoClickPromise;
            // console.log('finished awaiting promise');
            await sleep(500);
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
        if (this.state.paused) return;
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

    demoModeSwitchChange(checked) {
        // console.log(checked, this);
        this.demoModeSwitchValue = checked;
        this.autoClick = this.demoModeSwitchValue;
        this.checkAutoClick();
    }

    async setHint() {
        await this.handleClick(this.lastTripFound[this.clickList.length]);
        await sleep(100);
    }
    
    render() {
        let nbsp = String.fromCharCode(160);
        let nbspx4 = nbsp.repeat(4);
        let tripsStatus = `${String.fromCharCode(9989)} ${this.numtrips} ${nbspx4} ${String.fromCharCode(10060)} ${this.numwrong}`;
        let tripsFound = this.state.grid.tripsFound.length;
        let tripsFoundChar = (tripsFound ? String.fromCharCode(9311 + tripsFound) : ' ');
        let tripsFoundStatus = `${nbsp.repeat(20)}${tripsFoundChar}`;

        let gameStatus = (this.state.gameOver ? 'Game Over' : '');
        let shouldClearElapsed = this.clearElapsed;
        this.clearElapsed = false;
        // let showDbg = false;
        return (
            <div>
              {`Triples App ${nbspx4}`}
              <button onClick={() => this.startNewGame.bind(this)()}>
                New
              </button>
              <button style={{marginLeft: "20px"}} onClick={() => this.restartGame.bind(this)()}>
                {String.fromCharCode(10226)}
              </button>
              <label>
                <span> {`${nbspx4} Demo? `}</span>
                <Switch
                  className="react-switch"
                  onChange={this.demoModeSwitchChange.bind(this)}
                  id="demoModeSwitch"
                  checked={this.demoModeSwitchValue}
                  height={20}
                  width={40}
                />
              </label>
              <p/>
              <div className="game-info">
                <div style={{fontSize: "20px"}}>
                  <ElapsedTime
                    clearElapsed = {shouldClearElapsed}
                    paused = {this.state.paused}
                  />
                  <button style={{fontSize: "20px", marginLeft: "20px", padding: "0px", borderWidth: "0px"}} onClick={() => this.setPaused.bind(this)()}>
                    {(this.state.paused) ? String.fromCharCode(0x23e9) : String.fromCharCode(0x23f8)}
                  </button>
                  <button style={{marginLeft: "20px", borderRadius: "50%"}} onClick={() => this.setHint.bind(this)()}>
                    {String.fromCharCode(0x2139)}
                  </button>
                  <p/>
                  {tripsStatus}
                  {tripsFoundStatus}
                  <br/>
                  {gameStatus}
                </div>
              </div>
              <div className="game">
                <div className="game-board">
                  <Board
                    grid = {this.state.grid}
                    onClick = {(i) => this.handleClick.bind(this)(i)}
                  />
                </div>
              </div>
            </div>
        );
    }
}

export default Game;


