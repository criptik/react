import React from "react";
import ReactDOM from 'react-dom';
const { createCanvas } = require("canvas");


class MyButton extends React.Component {
    render() {
        // console.log('in MyButton.render,', this.props.imageUrl);
        return (
            <button className="header_btn" style={(this.props.highlight) ? {borderWidth:5} : {borderWidth:1}} onClick={this.props.onClick} >
                  <img alt="missing" src={this.props.imageUrl} />
            </button>
        )
        // <img height="60px" width="60px" alt="missing" src={this.props.imageUrl} />
    }
}
//               


// ========================================
class Base extends React.Component {
    constructor() {
        super();
        this.state={};
        this.state.highlight = false;
        this.state.coloridx = 0;
        this.state.canvasURL = [];
        this.state.colors = ['red', 'green', 'yellow'];

        this.state.colors.forEach((color) => {
            const canvas = createCanvas(30, 30);
            const ctx = canvas.getContext("2d");
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.fillStyle = color;
            ctx.fillRect(10, 10, 16, 16);
            ctx.strokeRect(4,4, 25, 25);
            ctx.closePath();
            let cidx = this.state.colors.indexOf(color);
            this.state.canvasURL[cidx] = canvas.toDataURL();
        });
    }

    render() {
        
        return ( <MyButton
                   text=""
                   imageUrl={this.state.canvasURL[this.state.coloridx]} //"image.png"
                   highlight={this.state.highlight}
                   onClick={()=>this.myclick()}
                 />
               );
    }
    myclick() {
        console.log('Click!');
        let newhighlight = !this.state.highlight;
        let newcoloridx = (this.state.coloridx + 1) % 3;
        this.setState({
            highlight: newhighlight,
            coloridx: newcoloridx,
        });
        
        
    }
}
// <MyButton text="Click" imageUrl="https://www.tutorialspoint.com/latest/inter-process-communication.png" />,


ReactDOM.render(
    <Base />,
    document.getElementById('root')
);


