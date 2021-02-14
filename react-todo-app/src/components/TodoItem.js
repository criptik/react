import React from "react";

class TodoItem extends React.Component {
    render() {
        let todo = this.props.todo;
        let myColor = (todo.completed) ? 'green' : 'red';
        let myStyle = {
            color : myColor,
        };
        return (
            <li style={myStyle}>
                <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => this.props.containerChange(todo.id)}
                />
                {todo.title}, id={todo.id}
            </li>
        );
    }
}

export default TodoItem;

