import React from "react";
import Header from "./Header";
import { Button, IconButton } from '@material-ui/core';
import SmileIcon from "@material-ui/icons/Mood";
import {Stack, ListItem, Select, MenuItem} from "@mui/material";

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
    
    sayBye() {
        alert('Bye');
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
              <Stack direction='row' style={{height:'30px'}} >
                <Select defaultValue="Opt1" variant="outlined">
                  <option value="Opt1" >Opt1</option>
                  <option value="opt2">option 2</option>
                  <option value="opt3">option3</option>
                </Select>
                <Button
                  style={{
                      textTransform: 'none',
                      minWidth: 0,
                      minHeight: 0,
                      paddingLeft: '8px',
                      paddingRight: '8px',
                  }}
                  variant="outlined"
                  onClick={this.sayBye.bind(this)}
                >
                  New
                </Button>
                <IconButton size="small" variant="outlined" onClick={this.sayHi.bind(this)}>
                  <SmileIcon fontSize="small"/>
                </IconButton>
                <ListItem>
                  Item Text
                </ListItem>
              </Stack>
            </React.Fragment>
        );
    }
}
export default RpcalcContainer
