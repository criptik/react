import React from 'react';
import ReactDOM from 'react-dom';
import NumericInput from 'react-numeric-input';
import './index.css';


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
              highlight={this.props.winline && this.props.winline.includes(i)}
              onClick={() => this.props.onClick(i)}
            />
        );
    }    
    
    render() {
        let rows = [];
        for (let r=0; r < this.props.boardSize; r++) {
            let cols = [];
            for (let c=0; c < this.props.boardSize; c++) {
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
        this.state = {
            history: [{
                squares: Array(9).fill(null),
            }],
            stepNumber: 0,
            xIsNext: true,
            boardSize: 3,
        };
        this.calcWinLines();
        this.reCalcWinLinesNeeded = false;
    }

    charFromNextState() {
        return this.state.xIsNext ? 'X' : 'O'
    }

    calcWinLines() {
        let bs = this.state.boardSize;
        function pushTo(a, r, c) {
            a.push(r*bs + c);
        }
        let wl = [];
        for (let r=0; r<bs; r++) {
            let wlx = [];
            for (let c=0; c<bs; c++) {
                pushTo(wlx, r, c);
            }
            wl.push(wlx);
        }
        console.log(bs, wl);
        for (let c=0; c<bs; c++) {
            let wlx = [];
            for (let r=0; r<bs; r++) {
                pushTo(wlx, r, c);
            }
            wl.push(wlx);
        }
        console.log(wl);
        let wlx = [];
        for (let r=0; r<bs; r++) {
            pushTo(wlx, r, r);
        }
        wl.push(wlx);
        wlx = [];
        for (let r=0; r<bs; r++) {
            pushTo(wlx, r, (bs-1)-r);
        }
        wl.push(wlx);
        
        this.winLines = wl;
        console.log(this.winLines);
    
    }
    
    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        const [winner] = this.calculateWinner(squares);
        if (winner || squares[i]) {
            return;
        }
        squares[i] = this.charFromNextState();
        this.setState({
            history: history.concat([{
                squares: squares,
            }]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext,
        });
    }


    jumpTo(step) {
        if (step < 0 || step >= this.state.history.length) return;
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0,
        });
    }
    
    calculateWinner(sq) {
        for (let i=0; i<this.winLines.length; i++) {
            let lineset = new Set(this.winLines[i].map(n => sq[n]));
            if (lineset.size === 1) {
                let elem = [...lineset][0];
                // have a winner if set is not all null
                if (elem) {
                    return [elem, this.winLines[i]];
                }
            }
        }
        // if we got this far, no winner.  Check if array is full, return 'Draw'
        var nullcount = sq.reduce((prev, val)=> prev + (val === null), 0);
        return (nullcount > 0 ? [null,null] : ['Draw',null])
    }

    handleNewBoardSize(e) {
        this.setState({boardSize: e});
        console.log(e, this.state);
        this.reCalcWinLinesNeeded = true;
    }
    
    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const [winner, winline] = this.calculateWinner(current.squares);

        if (this.reCalcWinLinesNeeded) {
            this.calcWinLines();
            this.reCalcWinLinesNeeded = false;
        }
        let status;
        if (winner) {
            status = 'Winner: ' + winner;
        } else {
            status = 'Next player: ' + this.charFromNextState();
        }
        let dbgInfo = `step=${this.state.stepNumber},  winline=${winline}, boardSize=${this.state.boardSize}`;
        let showDbg = true;
        let backDisable = this.state.stepNumber === 0;
        let fwdDisable = this.state.stepNumber === this.state.history.length - 1;
        return (
            <div>
              boardsize:&nbsp; 
              <NumericInput  className="num-input"
                             min={3} max={10}
                             value={this.state.boardSize}
                             onChange={(e)=> this.handleNewBoardSize(e)}
              />
              <p/>
            <div className="game">
              <div className="game-board">
                <Board
                  squares={current.squares}
                  onClick={(i) => this.handleClick(i)}
                  winline={winline}
                  boardSize={this.state.boardSize}
                />
              </div>
              <div className="game-info">
                <div>
                  {status}
                  <br/>
                  {showDbg && dbgInfo}
                </div>
                <div>
                  <button disabled={backDisable} onClick={() => this.jumpTo(this.state.stepNumber-1)}>Back</button>
                  <button disabled={fwdDisable} onClick={() => this.jumpTo(this.state.stepNumber+1)}>Fwd</button>
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


