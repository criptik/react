import React, { Component } from "react";
import PropTypes from "prop-types";

class InputTodo extends Component {
    state = {
        title: ""
    };

    static get propTypes() { 
        return { 
            addTodoProp: PropTypes.func,
        }; 
    }
    
    onChange(e) {
        this.setState(({
            [e.target.name] : e.target.value,
        }));
    }

    handleSubmit(e) {
        e.preventDefault();
        this.props.addTodoProp(this.state.title);
    }
    
    render() {
        return (
            <form onSubmit={this.handleSubmit.bind(this)}>
            <input
                type="text"
                placeholder="Add todo..."
                value={this.state.title}
                name="title"
                onChange={this.onChange.bind(this)}
            />
            <button>Submit</button>
            </form>
        )
    }
}
export default InputTodo
