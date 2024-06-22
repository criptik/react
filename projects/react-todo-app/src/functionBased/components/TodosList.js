import React from "react";
import PropTypes from "prop-types";
import TodoItem from "./TodoItem";


function TodosList(props) {
    TodosList.propTypes = { 
        todos : PropTypes.array,
        completionToggleProps: PropTypes.func,
        deleteTodoProps: PropTypes.func,
        updateTitleProps: PropTypes.func,
    }; 

    let sortedTodos = props.todos.sort((a,b) => (a.completed === b.completed) ? 0 : ((a.completed) ? -1 : 1));
    return (
        <ul>
            {sortedTodos.map(todo => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    completionToggleProps={props.completionToggleProps}
                    deleteTodoProps={props.deleteTodoProps}
                    updateTitleProps={props.updateTitleProps}
                />
            ))}
        </ul>
    )
}

export default TodosList

