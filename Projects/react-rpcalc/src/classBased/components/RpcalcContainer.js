import React from "react";
import Header from "./Header";
import { Button, IconButton } from '@material-ui/core';
import SmileIcon from "@material-ui/icons/Mood";

class StackObj {
    static nextid = 1;

    constructor(val, operator, ops) {
        this.val = val;
        this.operator = operator;
        this.ops =  (ops == null) ? [] : ops;
        this.id = StackObj.nextid++;
        console.log(this);
    }
X
    addOpInfo(operator, ops) {
        this.operator = operator;
        this.ops = ops;
    }
    
    toHtmlString() {
        const spaces = '&nbsp;&nbsp;&nbsp;&nbsp;';
        if (this.operator == null) {
            return `${this.val}<br>`
        } else if (this.ops.length === 0) {
            return `${this.val}${spaces}(${this.operator})<br>`
        } else {
            let optxt = `(${this.ops[0].val} ${this.operator} ${this.ops[1].val})`;
            return `${this.val}${spaces}${optxt}<br>`
        }
    }
}

class RpcalcContainer extends React.Component {
    state = {
        vals: [],
    };

    sayHi() {
        alert('Hi');
    }
    
    
    componentDidMount() {
        let initvals = [];
        for (let n=0; n<3; n++) {
            initvals.push(new StackObj(n));
        }
        this.setState({vals: initvals});
        console.log(this.state);
    }
    
    /****
        *     const temp = localStorage.getItem("todosState")
        *     const loadedTodosState = JSON.parse(temp)
     *     if (loadedTodosState) {
     *         this.setState(loadedTodosState);
     *     }
     * }

     * componentDidUpdate(prevProps, prevState) {
     *     if(prevState !== this.state) {
     *         const temp = JSON.stringify(this.state)
     *         localStorage.setItem("todosState", temp)
     *     }
     * }
     */
    render() {
        const redStyle = {
            color : 'red',
        };

        return (
            <React.Fragment>
                <Header />
                <h1>Hello from React Rpcalc App</h1>
                <h3 style={redStyle}>This one uses classBased Components</h3>
                <div>
                    {this.state.vals.map ( val => { return (
                    <div key={val.id}>
                        {val.toHtmlString()}
                    </div>
                    )})}
                </div>
              <Button variant="contained">
                Hello World
              </Button>
              <IconButton onClick={this.sayHi.bind(this)}>
                <SmileIcon />
              </IconButton>              
            </React.Fragment>
        );
    }
}
export default RpcalcContainer
