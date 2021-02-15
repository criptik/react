import React from "react";
import PropTypes from "prop-types";

class TodoItem extends React.Component {
    state = {
        editing : false,
    }
    
    static get propTypes() { 
        return { 
            todo : PropTypes.exact({
                id: PropTypes.number,
                title: PropTypes.string,
                completed: PropTypes.bool,
            }),
            containerChange: PropTypes.func,
            deleteTodoProps: PropTypes.func,
        }; 
    }

    handleEditing = () => {
        let todo = this.props.todo;
        console.log(`edit mode activated for id ${todo.id}`);
        this.setState({
            editing: true,
        })
    }
    
    render() {
        let todo = this.props.todo;
        let myColor = (todo.completed) ? 'green' : 'red';
        let myStyle = {
            color : myColor,
        };
        let viewMode = {};
        let editMode = {
            border: '1px solid black',
            display : 'block',
        };

        if (this.state.editing) {
            viewMode.display = "none";
        } else {
            editMode.display = "none";
        }
        return (
            <li style={myStyle}>
                <div onDoubleClick={this.handleEditing} style={viewMode}>
                    <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => this.props.containerChange(todo.id)}
                    />
                    <button onClick={() => this.props.deleteTodoProps(todo.id)}>
                        Delete Me!
                    </button>
                    {todo.title}, id={todo.id}
                </div>
                <input
                    type="text"
                    value={todo.title}
                    style={editMode}
                    onChange={e => {
                        this.props.updateTitleProps(e.target.value, todo.id);
                    }}
                    onKeyPress={e => {
                        if (e.key == 'Enter') this.setState({editing : false});
                    }}
                />
            </li>
        );
    }
}

export default TodoItem;

