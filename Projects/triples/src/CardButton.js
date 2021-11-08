import React from 'react';

class CardButton extends React.Component {
    render() {
        // console.log(this.props);
        let highlightStyle = (!this.props.value.highlight) ? null : {
            border: '3px solid Black',
            marginTop: '6px',
            marginRight: '6px',
        };
        return (
            <button
              style={highlightStyle}
              className="cardcomp"
              onClick={() => this.props.onClick(this.props.index)}>
              <img alt="missing" src={this.props.value.dataURL} height="auto" width="75px" />
            </button>
        );
    }
}

export default CardButton;
