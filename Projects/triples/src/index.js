import React from 'react';
import ReactDOM from 'react-dom';
import NumericInput from 'react-numeric-input';
import './index.css';
// var _ = require("underscore");
import * as _ from 'underscore';

function Square(props) {
    return (
        <button style={{backgroundColor: props.highlight ? "Pink" : "#fff"}} className="square" onClick={props.onClick}>
          {props.value}
        </button>
    );
}

class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square
              key={i}
              value={this.props.squares[i]}
              onClick={() => this.props.onClick(i)}
            />
        );
    }    
    
    render() {
        let rows = [];
        for (let r=0; r < this.props.rows; r++) {
            let cols = [];
            for (let c=0; c < this.props.cols; c++) {
                cols.push(this.renderSquare(r*this.props.boardSize + c));
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
            unshuf.push(i.toString(3).padStart(4, '0').split("").map((s) => parseInt(s)));
        }
        this.state = {};
        this.state.shuf = _.shuffle(unshuf);
        this.state.squares = [];
        for (let i=0; i<12; i++) {
            this.state.squares.push(this.state.shuf[i]);
        }
        console.log(this.state.squares);
        
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
                    rows={4}
                    cols={3}
                    squares = {this.state.squares}
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


