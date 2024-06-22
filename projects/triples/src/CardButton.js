import React from 'react';

class CardButton extends React.Component {
    constructor(props) {
        super(props);
        this.imgRef = React.createRef();
        this.callbacks = 0;
        this.transformsCreated = 0;
        this.id = ++CardButton.cardButtonCounter;
        this.shrinkGrowTime = 300;  // TODO: pass this down as a props
        this.setImageStyleDefault();
    }

    setImageStyleDefault() {
        this.imageStyle = {transition:'', transform:'scale(100%)'};
    }

    imageStyleClearTransition() {
        // clear transition, leave transform unchanged
        this.imageStyle = {...this.imageStyle, transition:''};
    }

    componentDidUpdate() {
        if (this.imgRef.current && this.props.value.imgRect === undefined) {
            let rect = this.imgRef.current.getBoundingClientRect();
            this.props.value.imgRect = rect;
            this.props.value.x = Math.floor(rect.x + rect.width/2);
            this.props.value.y = Math.floor(rect.y + rect.height/2);
            // console.log(this.props.index, this.props.value.x, this.props.value.y);
        }
    }
    
    transEndCallback(e) {
        if (!this.inTransition) return;
        // clear out instance vars
        this.inTransition = false;
        this.imageStyleClearTransition();
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
        if (this.props.value.highlight) {
            buttonStyle.border = '3px solid Black';
        };
        let sgstate = this.props.value.shrinkGrowState;
        if (sgstate !== 0) {
            this.transformsCreated++;
            let scaleTargetPct = (sgstate === 1 ? 100 : 0);
            this.imageStyle = {
                transition : `transform ${this.shrinkGrowTime}ms`,
                transform : `scale(${scaleTargetPct}%)`,
            }
            // console.log(`${this.props.value}, shrinkGrow=${this.props.value.shrinkGrowState}, id=${this.id}`);
            this.props.value.shrinkGrowState = 0;
            this.props.value.cbref = this;
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
                style={this.imageStyle}
              />
            </button>
        );
    }
}
CardButton.cardButtonCounter = 0;

export default CardButton;
