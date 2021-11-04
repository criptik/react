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
    }

    handleClick(i) {
        // console.log(`click on square ${i}`);
        let newclist = this.state.clickList;
        let newgrid = this.state.grid;
        if (newclist.includes(i)) {
            // remove from clicklist and unhighlight
            newclist.splice(newclist.indexOf(i),1);
            newgrid.ary[i].highlight = false;
        }
        else {
            newclist.push(i);
            newgrid.ary[i].highlight = true;
        }
        let newClickStatus = '';
        if (newclist.length === 3) {
            this.delayTimer = setTimeout((thisObj) => {
                // after timeout do this logic an re-render
                let newclist = thisObj.newclist;
                // check if we have a triple
                let isTrip = newgrid.isTrip(newclist[0], newclist[1], newclist[2]);
            
                newClickStatus = `${newclist} ${isTrip ? 'was a triple' : 'not a triple, try again'}`;
                newclist.forEach(idx => newgrid.ary[idx].highlight = false);
                // normal grid size, refill from source
                if (newgrid.length() <= 12) {
                    newclist.forEach((idx) =>  newgrid.fillFromSource(idx));
                }

                newclist = [];
                thisObj.setState({
                    clickList: newclist,
                    clickStatus: newClickStatus,
                    grid: newgrid,
                });
                clearTimeout(thisObj.delayTimer);
            }, 300, this);
        }
        console.log(newclist);
        this.newclist = newclist;
        this.setState({
            clickList: newclist,
            grid : newgrid,
            clickStatus: newClickStatus,            
        });
    }
    
    initBoard() {
    }
    
    render() {
        let status = `Status:  ClickList ${this.state.clickList}  ${this.state.clickStatus}`;
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


