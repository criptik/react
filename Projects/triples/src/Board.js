import React from 'react';
import CardButton from './CardButton.js';

class Board extends React.Component {
    renderCard(i) {
        return (
            <CardButton
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
                cols.push(this.renderCard(r*numcols + c));
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

export default Board;
