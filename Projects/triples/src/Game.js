import React from 'react';
// import NumericInput from 'react-numeric-input';
import './index.css';
import * as _ from 'underscore';
import {CardGrid, CardData} from './carddata.js';
import Board from './Board.js';
// import * as assert from 'assert';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        // shuffle the cards 0-80
        let unshuf = [];
        for (let i=0; i<81; i++) {
            unshuf.push(i);
        }
        let ishuf = _.shuffle(unshuf);
        let source = ishuf.map((n) => new CardData(n));
        // For now, the only state we really need is the grid
        this.state = {};
        this.state.grid = new CardGrid(source, 4, 3);

        // start by filling grid with min rows
        // this.state.grid.minrows = 3;
        this.lastTripFound = this.state.grid.fillUntilHasTrip();
        this.autoClick = true;
        this.pauseWithHighlightsTime = 300;
        this.pauseWithBlanksTime = 300;

        this.clickList = [];
        this.numtrips = this.numwrong = 0;
        this.state.gameOver = false;
        // console.log(this.state.grid);
    }

    componentDidMount() {
        if (this.autoClick) {
            this.pauseWithHighlightsTime = 1500;
            this.pauseWithBlanksTime = 500;
            this.autoClickProcess();
        }
    }
    
    async click3ProcessStart() {
        // console.log(this.clickList);
        // after timeout do this logic an re-render
        let isTrip = this.newgrid.isTrip(this.clickList[0], this.clickList[1], this.clickList[2]);
        if (!isTrip) {
            this.clickList.forEach(idx => this.newgrid.clearHighlight(idx));
            this.clickList = [];
            this.numwrong++;
        }
        else {
            // this logic if it is a triple
            this.numtrips++;
            // normal grid size, refill from source
            // but first before refilling, show blanks for a short time
            this.clickList.forEach((idx) =>  this.newgrid.fillWithBlank(idx));
            await sleep(this.pauseWithBlanksTime);
            this.click3ProcessRefill();
        }
        this.setState({
            grid: this.newgrid,
        });
    }

    click3ProcessRefill() {
        this.newgrid.tripRemoveReplace(this.clickList);
        this.lastTripFound = this.newgrid.fillUntilHasTrip();
        this.clickList = [];
        this.setState({
            grid: this.newgrid,
            gameOver: (this.lastTripFound === null),
        });
        if (this.lastTripFound !== null && this.autoClick) {
            this.autoClickProcess();
        }
    }

    autoClickProcess() {
        this.newgrid = this.state.grid;
        if (this.lastTripFound === null) {
            this.setState({
                gameOver: true,
                });
        }
        else {
            if (false) {
                this.setState({
                    grid: this.newgrid,
                });
            }
            this.clickList = [];
            this.lastTripFound.forEach(async (idx) => {
                this.handleClick(idx);
                await sleep(100);
            });
        }
    }
    
    async handleClick(i) {
        // console.log(`click on square ${i}`);
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
            this.click3ProcessStart();
        }
    }
    
    initBoard() {
    }
    
    render() {
        let tripsStatus = `${String.fromCharCode(9745)}: ${this.numtrips} ...  ${String.fromCharCode(9746)} ${this.numwrong}`;
        let gameStatus = (this.state.gameOver ? 'Game Over' : '');
        // let showDbg = false;
        return (
            <div>
              Triples App
              <p/>
              <div className="game">
                <div className="game-board">
                  <Board
                    grid = {this.state.grid}
                    onClick = {(i) => this.handleClick(i)}
                  />
                </div>
                <div className="game-info">
                  <div>
                    {tripsStatus}
                    <br/>
                    {gameStatus}
                  </div>
                </div>
              </div>
            </div>
        );
    }
}

export default Game;


