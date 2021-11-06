import React from 'react';
// import NumericInput from 'react-numeric-input';
import './index.css';
import * as _ from 'underscore';
import {CardGrid, CardData} from './carddata.js';
import Board from './Board.js';
// import * as assert from 'assert';


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
        this.state = {};
        this.state.grid = new CardGrid(source, 4, 2);

        // start by filling grid with min rows
        // this.state.grid.minrows = 3;
        this.lastTripFound = this.state.grid.fillUntilHasTrip();
        this.state.containsTrip = (this.lastTripFound !== null);
        this.autoClick = false;
        this.pauseWithHighlightsTime = 300;
        this.pauseWithBlanksTime = 300;
        if (this.autoClick) {
            this.pauseWithHighlightsTime = 1500;
            this.pauseWithBlanksTime = 500;
            this.autoClickProcess();
        }
        // console.log(this.state.grid);

        this.state.clickList = [];
        this.state.clickStatus = '';
        this.numtrips = this.numwrong = 0;
        this.state.gameOver = false;
    }

    click3ProcessStart() {
        // console.log(this.newclist);
        // after timeout do this logic an re-render
        let isTrip = this.newgrid.isTrip(this.newclist[0], this.newclist[1], this.newclist[2]);
        this.newClickStatus = `${this.newclist} ${isTrip ? 'was a triple' : 'not a triple, try again'}`;
        if (!isTrip) {
            this.newclist.forEach(idx => this.newgrid.clearHighlight(idx));
            this.newclist = [];
            this.numwrong++;
        }
        else {
            // this logic if it is a triple
            this.numtrips++;
            // normal grid size, refill from source
            // but first before refilling, show blanks for a short time
            this.newclist.forEach((idx) =>  this.newgrid.fillWithBlank(idx));
            this.blankTimer = setTimeout( this.click3ProcessRefill.bind(this), this.pauseWithBlanksTime);
        }
        this.setState({
            clickList: this.newclist,
            clickStatus: this.newClickStatus,
            grid: this.newgrid,
        });
        clearTimeout(this.delayTimer);
    }

    click3ProcessRefill() {
        this.newgrid.tripRemoveReplace(this.newclist);
        this.lastTripFound = this.newgrid.fillUntilHasTrip();
        clearTimeout(this.blankTimer);
        this.setState({
            clickList: [],
            clickStatus: this.newClickStatus,
            grid: this.newgrid,
            containsTrip:(this.lastTripFound !== null),
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
                    clickList: [],
                    grid: this.newgrid,
                    containsTrip:(this.lastTripFound !== null), 
                });
            }
            this.state.clickList = [];
            this.lastTripFound.forEach((idx) => this.handleClick(idx));
        }
    }
    
    handleClick(i) {
        // console.log(`click on square ${i}`);
        this.newclist = this.state.clickList;
        this.newgrid = this.state.grid;
        if (this.newclist.includes(i)) {
            // remove from clicklist and unhighlight
            this.newclist.splice(this.newclist.indexOf(i),1);
            this.newgrid.clearHighlight(i);
        }
        else {
            this.newclist.push(i);
            this.newgrid.setHighlight(i);
        }
        this.newClickStatus = '';
        if (this.newclist.length === 3) {
            this.delayTimer = setTimeout(this.click3ProcessStart.bind(this), this.pauseWithHighlightsTime);
        }
        this.setState({
            clickList: this.newclist,
            grid : this.newgrid,
            clickStatus: this.newClickStatus,            
        });
    }
    
    initBoard() {
    }
    
    render() {
        // let status = `${this.state.containsTrip} ClickList ${this.state.clickList}  ${this.state.clickStatus}`;
        let tripsStatus = `Found: ${this.numtrips}`;
        let wrongStatus = `Wrong: ${this.numwrong}`;
        let gameStatus = (this.state.gameOver ? 'Game Over' : '');

        // console.log(status);
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
                    {wrongStatus}
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


