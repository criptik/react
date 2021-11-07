import React from 'react';

class CardButton extends React.Component {
    render() {
        // console.log(this.props);
        return (
            <button style={{border: this.props.value.highlight ? "3px solid Black" : "1px solid #999"}} className="cardcomp" onClick={() => this.props.onClick(this.props.index)}>
              <img alt="missing" src={this.props.value.dataURL} height="auto" width="75px" />
            </button>
        );
    }
}

export default CardButton;
