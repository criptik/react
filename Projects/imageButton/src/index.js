import React from "react";
import ReactDOM from 'react-dom';
const { createCanvas } = require("canvas");


class MyButton extends React.Component {
    render() {
        console.log('in MyButton.render,', this.props.imageUrl);
        return (
            <button className="header_btn" style={(this.props.highlight) ? {borderWidth:5} : {borderWidth:1}} onClick={this.props.onClick} >
                  <img height="60px" width="60px" alt="missing" src={this.props.imageUrl.src} />
            </button>
        )
    }
}
//               


// ========================================
class Base extends React.Component {
    constructor() {
        super();
        this.state={};
        this.state.highlight = false;
    }

    render() {
        const canvas = createCanvas(100, 200);
        const ctx = canvas.getContext("2d");
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 30, 30);
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 25, 25);
        ctx.closePath();
        
        var target = new Image();
        target.src = canvas.toDataURL();
        console.log(target);

        return ( <MyButton
                   text=""
                   imageUrl={target} //"image.png"
                   highlight={this.state.highlight}
                   onClick={()=>this.myclick()}
                 />
               );
    }
    myclick() {
        console.log('Click!');
        let newhighlight = !this.state.highlight;
        this.setState({
            highlight: newhighlight,
        });
        
    }
}
// <MyButton text="Click" imageUrl="https://www.tutorialspoint.com/latest/inter-process-communication.png" />,


ReactDOM.render(
    <Base />,
    document.getElementById('root')
);


