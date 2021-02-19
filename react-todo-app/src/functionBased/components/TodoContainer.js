import React, { useState, useEffect } from "react";
import TodosList from "./TodosList";
import Header from "./Header";
import InputTodo from "./InputTodo";

function TodoContainer(props) {
    const localStorageKey = 'todosState';

    function getInitialState() {
        const emptyState = {todos: [], nextid: 1};
        const savedState = JSON.parse(localStorage.getItem(localStorageKey));
        return (savedState ? savedState : emptyState);
    }               

    const[curState, setNewState] = useState(getInitialState());

    function saveStateToLocalStorage() {
        const temp = JSON.stringify(curState);
        localStorage.setItem(localStorageKey, temp);
    }
    
    // gets run on any update of state
    useEffect(saveStateToLocalStorage,
              [curState]);

    function setNewTodos(newtodos) {
        setNewState({
            ...curState,
            todos: newtodos,
        });
    }
    
    function setUpdateTitle(updatedTitle, id) {
        console.log(updatedTitle, id);
        setNewTodos(curState.todos.map(todo => (todo.id === id) ? {...todo, title : updatedTitle} : todo))
    }

    function handleCompletionToggle(id) {
        setNewTodos(curState.todos.map(todo => (todo.id === id) ? {...todo, completed : !todo.completed} : todo));
    }

    function delTodo(id) {
        setNewTodos(curState.todos.filter(todo => (todo.id !== id)));
    }

    function addTodoItem(title) {
        let newid = curState.nextid;
        let newTodo = {
            id: newid,
            title: title,
            completed: false
        };
        
        setNewState({
            ...curState,
            todos: [...curState.todos, newTodo],
            nextid: newid+1,
        });
    }
    
    const redStyle = {
        color : 'red',
    };

    return (
        <React.Fragment>
            <h1>Hello from the React Todo App</h1>
            <h3 style={redStyle}>This is the function-based Implementation.</h3>
            <Header />
            <InputTodo
                addTodoProp={addTodoItem}
            />
            <TodosList
                todos={curState.todos}
                completionToggleProps={handleCompletionToggle}
                deleteTodoProps={delTodo}
                updateTitleProps={setUpdateTitle}
            />
        </React.Fragment>
    );
}

export default TodoContainer
