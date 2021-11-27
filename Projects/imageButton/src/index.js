import React from "react";
import ReactDOM from 'react-dom';
const { createCanvas } = require("canvas");


class MyButton extends React.Component {
    render() {
        let buttonStyle = {};
        let animTime = 'transform 500ms'
        if (this.props.animState == 'Shrink') {
            buttonStyle.transition = animTime;
            buttonStyle.transform = 'scale(0%)';
        }
        else if (this.props.animState == 'Grow') {
            buttonStyle.transition = animTime;
            buttonStyle.transform = 'scale(100%)';
        }
        return (
            <div>
              <button className="header_btn" style={(this.props.highlight) ? {borderWidth:5} : {borderWidth:1}} onClick={this.props.onClick} >
                <img alt="missing" src={this.props.imageUrl} style={buttonStyle} height="auto"  />
              </button>
            </div>
        )
    }
}
//               


// ========================================
class Base extends React.Component {
    constructor() {
        super();
        this.clicks = 0;
        this.state={};
        this.state.highlight = false;
        this.state.coloridx = 0;
        this.state.canvasURL = [];
        this.state.colors = ['red', 'green', 'yellow'];
        this.state.scale = 100;
        this.state.animState = null;
        
        this.state.colors.forEach((color) => {
            const canvas = createCanvas(30, 30);
            const ctx = canvas.getContext("2d");
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.fillStyle = color;
            ctx.fillRect(2, 2, 26, 26);
            // ctx.strokeRect(4,4, 25, 25);
            ctx.closePath();
            let cidx = this.state.colors.indexOf(color);
            this.state.canvasURL[cidx] = canvas.toDataURL();
        });
    }

    render() {
        let buttonStyle = {};
        return ( <MyButton
                   text=""
                   imageUrl={this.state.canvasURL[this.state.coloridx]} //"image.png"
                   highlight={this.state.highlight}
                   onClick={()=>this.myclick()}
                   animState = {this.state.animState}
                 />
               );
    }

    myclick() {
        console.log('Click!');
        this.clicks++;
        let newhighlight = !this.state.highlight;
        let newcoloridx = (this.state.coloridx + 1) % 3;
        this.setState({
            highlight: newhighlight,
            coloridx: newcoloridx,
            animState: (this.clicks % 2 == 1 ? 'Shrink' : 'Grow'),
        });
    }
}
// <MyButton text="Click" imageUrl="https://www.tutorialspoint.com/latest/inter-process-communication.png" />,


ReactDOM.render(
    <Base />,
    document.getElementById('root')
);


