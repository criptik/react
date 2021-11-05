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
        this.state.grid = new CardGrid(source);

        // start by filling grid with 12
        for (let i=0; i<12; i++) {
            this.state.grid.pushFromSource();
        }
        this.state.containsTrip = (this.state.grid.includesTrip() !== null);
        // console.log(this.state.grid);

        this.state.clickList = [];
        this.state.clickStatus = '';
        this.numtrips = 0;
    }

    click3ProcessStart() {
        // after timeout do this logic an re-render
        let isTrip = this.newgrid.isTrip(this.newclist[0], this.newclist[1], this.newclist[2]);
        this.newClickStatus = `${this.newclist} ${isTrip ? 'was a triple' : 'not a triple, try again'}`;
        if (!isTrip) {
            this.newclist.forEach(idx => this.newgrid.clearHighlight(idx));
            this.newclist = [];
        }
        else {
            // this logic if it is a triple
            this.numtrips++;
            // normal grid size, refill from source
            // but first before refilling, show blanks for a short time
            this.newclist.forEach((idx) =>  this.newgrid.fillWithBlank(idx));
            this.blankTimer = setTimeout( this.click3ProcessRefill.bind(this), 200);
        }
        this.setState({
            clickList: this.newclist,
            clickStatus: this.newClickStatus,
            grid: this.newgrid,
        });
        clearTimeout(this.delayTimer);
    }

    click3ProcessRefill() {
        this.newclist.forEach((idx) =>  this.newgrid.fillFromSource(idx));
        clearTimeout(this.blankTimer);
        this.setState({
            clickList: [],
            clickStatus: this.newClickStatus,
            grid: this.newgrid,
            containsTrip:(this.state.grid.includesTrip() !== null), 
        });
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
            this.delayTimer = setTimeout(this.click3ProcessStart.bind(this), 200);
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
        let status = `${this.state.containsTrip} ClickList ${this.state.clickList}  ${this.state.clickStatus}`;
        let tripsStatus = `Triples Found: ${this.numtrips}`; 
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
                    {status}
                    <br/>
                    {tripsStatus}
                  </div>
                </div>
              </div>
            </div>
        );
    }
}

export default Game;


