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
        this.newBoardSize = 3;
        this.newWinSize = 3;
        this.state = {
            history: [{
                squares: Array(this.newBoardSize ** 2).fill(null),
            }],
            stepNumber: 0,
            xIsNext: true,
            boardSize: this.newBoardSize,
            winSize: this.newWinSize,
        };
        this.calcWinLines();
        // console.log('constructor done: ', this.newState, this.newState.history[0]); 
    }
    charFromNextState() {
        return this.state.xIsNext ? 'X' : 'O'
    }

    calcWinLines() {
        let bs = this.newBoardSize;
        let ws = this.newWinSize;
        function pushRange(wl, rslo, rshi, cslo, cshi, rstep, cstep) {
            for (let rstart=rslo; rstart <= rshi; rstart++) {
                for (let cstart=cslo; cstart <= cshi; cstart++) {
                    let wlx = [];
                    for (let r=rstart, c=cstart, count=0; count < ws; r += rstep, c += cstep, count++) {
                        wlx.push(r*bs + c);
                    }
                    wl.push(wlx);
                }
            }
        }
        let wl = [];
        pushRange(wl, 0, bs-1, 0, bs-ws, 0, 1);  // horizontal
        pushRange(wl, 0, bs-ws, 0, bs-1, 1, 0);  // vertical
        pushRange(wl, 0, bs-ws, 0, bs-ws, 1, 1);  // diag NW-SE
        pushRange(wl, ws-1, bs-1, 0, bs-ws, -1, 1);  // diag SW-NE
        
        this.winLines = wl;
        // console.log(this.winLines);
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
        this.newBoardSize = e;
        this.initBoard();
    }

    handleNewWinSize(e) {
        this.newWinSize = e;
        this.initBoard();
    }

    initBoard() {
        this.setState({
            history: [{
                squares: Array(this.newBoardSize ** 2).fill(null),
            }],
            stepNumber: 0,
            xIsNext: true,
            boardSize: this.newBoardSize,
            winSize: this.newWinSize,
        });
        this.calcWinLines();
    }
    
    render() {
        // console.log(`in render`, this.state);
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const [winner, winline] = this.calculateWinner(current.squares);

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
              winsize:&nbsp; 
              <NumericInput  className="num-input"
                             min={3} max={this.state.boardSize}
                             value={this.state.winSize}
                             onChange={(e)=> this.handleNewWinSize(e)}
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


