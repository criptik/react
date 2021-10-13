import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';


function Square(props) {
    return (
        <button className="square" onClick={props.onClick}>
          {props.value}
        </button>
    );
}

class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square
              value={this.props.squares[i]}
              onClick={() => this.props.onClick(i)}
            />
        );
    }    
    
    render() {
        let rows = [];
        for (let r=0; r<3; r++) {
            let cols = [];
            for (let c=0; c<3; c++) {
                cols.push(this.renderSquare(r*3 + c));
            }
            rows.push(<div className='board-row'>{cols}</div>);
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
        };
    }

    charFromNextState() {
        return this.state.xIsNext ? 'X' : 'O'
    }
    
    
    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        if (calculateWinner(squares) || squares[i]) {
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
    
    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares);

        const moves = history.map((step, move) => {
            const desc = move ?
                  'Go to move #' + move :
                  'Go to game start';
            return (
                <li>
                  <button onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            );
        });        
        let status;
        if (winner) {
            status = 'Winner: ' + winner;
        } else {
            status = 'Next player: ' + this.charFromNextState();
        }
        let dbgInfo = `step=${this.state.stepNumber} histlength=${this.state.history.length}`;
        let fwdDisable = this.state.stepNumber === this.state.history.length;
        return (
            <div className="game">
              <div className="game-board">
                <Board
                  squares={current.squares}
                  onClick={(i) => this.handleClick(i)}
                />
              </div>
              <div className="game-info">
                <div>
                  {status}
                  <p>
                    {dbgInfo}
                  </p>
                </div>
                <div>
                  <button onClick={() => this.jumpTo(this.state.stepNumber-1)}>Back</button>
                  <button disabled={fwdDisable} onClick={() => this.jumpTo(this.state.stepNumber+1)}>Fwd</button>
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


function calculateWinner(sq) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i=0; i<lines.length; i++) {
        let lineset = new Set(lines[i].map(n => sq[n]));
        if (lineset.size === 1) {
            let elem = [...lineset][0];
            // have a winner if set is not all null
            if (elem) {
                return elem;
            }
        }
    }
    // if we got this far, no winner.  Check if array is full, return 'Draw'
    var nullcount = sq.reduce((prev, val)=> prev + (val === null), 0);
    return (nullcount > 0 ? null : 'Draw')
}
