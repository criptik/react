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
    
    return (
        <ul>
            {props.todos.map(todo => (
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

