import React from "react";
import TodoItem from "./TodoItem";

class TodosList extends React.Component {
    render() {
        return (
            <ul>
                {this.props.todos.map(todo => (
                    <TodoItem
                        key={todo.id}
                        todo={todo}
                        containerChange={this.props.containerChange}
                        deleteTodoProps={this.props.deleteTodoProps}
                        updateTitleProps={this.props.updateTitleProps}
                    />
                ))}
            </ul>
        )
    }
}

export default TodosList

