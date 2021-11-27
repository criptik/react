import React from 'react';

class CardButton extends React.Component {
    constructor(props) {
        super(props);
        this.imgRef = React.createRef();
        this.callbacks = 0;
        this.transformsCreated = 0;
        this.id = ++CardButton.cardButtonCounter;
    }
    
    transEndCallback(e) {
        if (!this.inTransition) return;
        this.inTransition = false;
        this.callbacks++;
        // console.log(`CardButton ${this.props.value} transition to ${this.imgRef.current.style.transform} finished, ${e.elapsedTime} `);
        this.imgRef.current.removeEventListener('transitionend', this.transEndCallback.bind(this));
        // finally, call the callBack that Game component passed down, if any
        if (this.props.value.onTransEnd) {
            this.props.value.onTransEnd(e);
            this.props.value.onTransEnd = null;
        }
    }
    
    render() {
        // override some style things if highlight on (otherwise use default css)
        let buttonStyle = {};
        let imageStyle = {};
        if (this.props.value.highlight) {
            buttonStyle.border = '3px solid Black';
        };
        let sgstate = this.props.value.shrinkGrowState;
        if (sgstate !== 0) {
            this.transformsCreated++;
            imageStyle.transition = 'transform 300ms';
            imageStyle.transform = (sgstate === 1 ? 'scale(100%)' : 'scale(0%)');
            // console.log(`${this.props.value}, shrinkGrow=${this.props.value.shrinkGrowState}, id=${this.id}`);
            this.props.value.shrinkGrowState = 0;
            if (this.imgRef.current && this.props.value.onTransEnd) {
                this.imgRef.current.addEventListener('transitionend', (e) => this.transEndCallback.bind(this)(e)); 
                this.inTransition = true;
            }
        }
        
        return (
            <button
              style={buttonStyle}
              className="cardcomp"
              onClick={() => this.props.onClick(this.props.index)}>
              <img
                ref={this.imgRef}
                alt="missing"
                src={this.props.value.dataURL}
                height="auto"
                width={this.props.value.imageWidth}
                style={imageStyle}
              />
            </button>
        );
    }
}
CardButton.cardButtonCounter = 0;

export default CardButton;
