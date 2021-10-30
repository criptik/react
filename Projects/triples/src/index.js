import React from 'react';
import ReactDOM from 'react-dom';
import NumericInput from 'react-numeric-input';
import './index.css';
// var _ = require("underscore");
import * as _ from 'underscore';
import {CardGrid, CardAry, CardData} from './carddata.js';
import * as assert from 'assert';

function Square(props) {
    console.log(props);
    return (
        <button style={{backgroundColor: props.highlight ? "Pink" : "#fff"}} className="square" onClick={props.onClick}>
          {props.value.asint}
        </button>
    );
}

class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square
              key={i}
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
        console.log(this.state.grid);
        
    }

    handleClick(i) {
        console.log(`click on square ${i}`);
    }
    
    initBoard() {
    }
    
    render() {
        let status = 'Status';
        let showDbg = false;
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


