import React from "react";
import PropTypes from "prop-types";
import TodoItem from "./TodoItem";


class TodosList extends React.Component {
    static get propTypes() { 
        return { 
            todos : PropTypes.array,
            containerChange: PropTypes.func,
            deleteTodoProps: PropTypes.func,
            updateTitleProps: PropTypes.func,
        }; 
    }

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

