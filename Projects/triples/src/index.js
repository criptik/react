import React from 'react';
import ReactDOM from 'react-dom';
// import NumericInput from 'react-numeric-input';
import './index.css';
import * as _ from 'underscore';
import {CardGrid, CardData} from './carddata.js';
// import * as assert from 'assert';

class Square extends React.Component {
    render() {
        // console.log(this.props);
        // let attrStr = this.props.value.attrs.join("");
        return (
            <button style={{border: this.props.value.highlight ? "3px solid Red" : "1px solid #999"}} className="square" onClick={() => this.props.onClick(this.props.index)}>
              <img alt="missing" src={this.props.value.dataURL} />
            </button>
        );
    }
}

class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square
              key={i}
              index={i}
              value={this.props.grid.ary[i]}
              onClick={(i) => this.props.onClick(i)}
            />
        );
    }    
    
    render() {
        let rows = [];
        let numcols = this.props.grid.cols;
        let numrows = Math.floor(this.props.grid.length() / numcols);
        for (let r=0; r < numrows; r++) {
            let cols = [];
            for (let c=0; c < numcols; c++) {
                cols.push(this.renderSquare(r*numcols + c));
            }
            rows.push(<div key={r} className='board-row'>{cols}</div>);
        }
        return(
            <div>
              {rows}
            </div>
        )
    }
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
        this.state = {};
        this.state.grid = new CardGrid(source);

        // start by filling grid with 12
        for (let i=0; i<12; i++) {
            this.state.grid.pushFromSource();
        }
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
            this.blankTimer = setTimeout( this.click3ProcessRefill.bind(this), 300);
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
            this.delayTimer = setTimeout(this.click3ProcessStart.bind(this), 300);
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
        let status = `ClickList ${this.state.clickList}  ${this.state.clickStatus}`;
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

// ========================================

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);


